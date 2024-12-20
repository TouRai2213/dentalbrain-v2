const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// 在文件顶部添加日志过滤配置
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => {
  // 过滤掉二进制数据和短行日志
  if (typeof chunk === 'string' && chunk.trim().length > 3) {
    return originalStdoutWrite(chunk, encoding, callback);
  }
  return true;
};

const originalConsoleLog = console.log;
console.log = (...args) => {
  // 过滤掉短消息和二进制数据
  const message = args.join(' ');
  if (message.trim().length > 3) {
    originalConsoleLog.apply(console, args);
  }
};

console.log('\n=== Server Starting ===');
console.log('Time:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Frontend URL:', 'http://localhost:5174');
console.log('======================\n');

// 配置 AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// 在 S3 配置后添加测试代码
console.log('Testing S3 connection...');
s3.headBucket({ Bucket: process.env.AWS_BUCKET_NAME }).promise()
  .then(() => {
    console.log('S3 bucket access successful:', process.env.AWS_BUCKET_NAME);
  })
  .catch(err => {
    console.error('S3 bucket access error:', err);
  });

// 1. 中间件配置 - 确保顺序正确
// CORS 配置
app.use(cors({
  origin: [
    'https://v2.dentalbrain.app',
    'http://localhost:5174',
    'http://localhost:3002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 统一的日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  // 立即刷新输出
  process.stdout.write('\n=== New Request ===\n');
  process.stdout.write(`Time: ${new Date().toISOString()}\n`);
  process.stdout.write(`${req.method} ${req.url}\n`);
  process.stdout.write(`Body: ${JSON.stringify(req.body, null, 2)}\n`);
  process.stdout.write(`Query: ${JSON.stringify(req.query, null, 2)}\n`);
  process.stdout.write(`Params: ${JSON.stringify(req.params, null, 2)}\n`);
  
  // 使用 process.stdout.write 替代 console.error
  const oldWrite = res.write;
  const oldEnd = res.end;

  const chunks = [];

  res.write = function (chunk) {
    chunks.push(chunk);
    return oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk) {
      chunks.push(chunk);
    }
    
    const duration = Date.now() - start;
    process.stdout.write(`\nResponse sent: ${res.statusCode} (${duration}ms)\n`);
    process.stdout.write('Response body: ' + Buffer.concat(chunks).toString('utf8') + '\n');
    process.stdout.write('=== Request End ===\n\n');
    
    oldEnd.apply(res, arguments);
  };

  next();
});

// 添加未捕获异常的处理
process.on('uncaughtException', (err) => {
  process.stdout.write(`Uncaught Exception: ${err}\n`);
  process.stdout.write(err.stack + '\n');
});

process.on('unhandledRejection', (reason, promise) => {
  process.stdout.write(`Unhandled Rejection at: ${promise}\n`);
  process.stdout.write(`Reason: ${reason}\n`);
});

// 2. 图片相关的路由组 - 移到最前面
// 更新图片标注
app.put('/api/images/:imageId/annotations', async (req, res) => {
  console.log('=== Annotation Update Process Started ===');
  console.log('Request details:', {
    imageId: req.params.imageId,
    hasAnnotations: !!req.body.annotations,
    annotationsLength: req.body.annotations?.length,
    requestBody: JSON.stringify(req.body, null, 2)
  });

  try {
    const { imageId } = req.params;
    const { annotations } = req.body;

    // 验证请求体格式
    if (!annotations) {
      console.log('Validation failed: Missing annotations');
      return res.status(400).json({ 
        error: 'Invalid request format', 
        message: 'Request body must contain annotations field' 
      });
    }

    // 开始事务
    const connection = await pool.getConnection();
    console.log('Database connection acquired');
    
    await connection.beginTransaction();
    console.log('Transaction started');

    try {
      // 1. 验证图片是否存在
      console.log('Checking if image exists:', imageId);
      const [imageRows] = await connection.execute(
        'SELECT img_id, img_url FROM t_image_list WHERE img_id = ?',
        [imageId]
      );
      console.log('Image query result:', imageRows);

      if (imageRows.length === 0) {
        throw new Error(`Image not found with id: ${imageId}`);
      }

      // 2. 更新标注信息
      console.log('Updating annotations in database...');
      const annotationsJson = JSON.stringify(annotations);
      console.log('Annotations to save:', annotationsJson);

      const updateResult = await connection.execute(
        'UPDATE t_image_list SET annotations = ? WHERE img_id = ?',
        [annotationsJson, imageId]
      );
      console.log('Update result:', updateResult);

      // 3. 提交事务
      await connection.commit();
      console.log('Transaction committed successfully');

      // 4. 返回成功响应
      const response = { 
        success: true, 
        message: 'Annotations updated successfully',
        data: {
          imageId,
          annotationsCount: annotations.length,
          updateInfo: updateResult[0]
        }
      };
      console.log('Sending response:', response);
      res.json(response);

    } catch (error) {
      console.error('Error during transaction:', error);
      await connection.rollback();
      console.log('Transaction rolled back');
      throw error;
    } finally {
      connection.release();
      console.log('Database connection released');
    }

  } catch (error) {
    console.error('=== Annotation Update Failed ===');
    console.error('Error details:', {
      imageId: req.params.imageId,
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: 'Failed to update annotations',
      message: error.message 
    });
  } finally {
    console.log('=== Annotation Update Process Completed ===');
  }
});

// 删除图片
app.delete('/api/images/:imageId', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. 获取图片信息
      const [rows] = await connection.execute(
        'SELECT img_url FROM t_image_list WHERE img_id = ?',
        [req.params.imageId]
      );

      if (rows.length === 0) {
        throw new Error('Image not found');
      }

      // 2. 从S3删除图片
      const url = rows[0].img_url;
      const key = url.split('.amazonaws.com/')[1]; // 修改分割方式
      console.log('Deleting S3 object with key:', key);

      try {
        await s3.deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        }).promise();
        console.log('S3 object deleted successfully');
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
        throw s3Error;
      }

      // 3. 从数据库删除记录
      await connection.execute(
        'DELETE FROM t_image_list WHERE img_id = ?',
        [req.params.imageId]
      );

      await connection.commit();
      res.json({ success: true });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image', details: error.message });
  }
});

// 修改代理图片的路由
app.get('/api/images/proxy/:imageId', async (req, res) => {
  try {
    console.log(`\n=== Proxying image ${req.params.imageId} ===`);
    
    const [rows] = await pool.execute(
      'SELECT img_url FROM t_image_list WHERE img_id = ?',
      [req.params.imageId]
    );

    if (rows.length === 0) {
      console.log('Image not found in database');
      return res.status(404).send('Image not found');
    }

    const url = rows[0].img_url;
    console.log('Source URL:', url);

    // 尝试直接代理外部 URL
    const proxyExternalUrl = async (url) => {
      console.log('Proxying external URL');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const buffer = await response.buffer();
      res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    };

    // 如果是外部 URL，直接代理
    if (url.startsWith('http') && !url.includes('amazonaws.com')) {
      try {
        await proxyExternalUrl(url);
        console.log('=== Proxy completed ===\n');
        return;
      } catch (fetchError) {
        console.error('External URL fetch failed');
      }
    }

    // 尝试从 S3 获取
    try {
      let key = url;
      if (url.includes('.amazonaws.com/')) {
        key = url.split('.amazonaws.com/')[1];
      } else if (url.includes('group1/M00/')) {
        key = url.split('group1/M00/')[1];
      } else if (url.startsWith('users/')) {
        key = url;
      } else if (url.includes('/')) {
        key = url.split('/').pop() || url;
      }
      
      console.log('S3 key:', key);
      
      const s3Object = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      }).promise();

      console.log('S3 fetch successful');
      res.setHeader('Content-Type', s3Object.ContentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(s3Object.Body);
      console.log('=== Proxy completed ===\n');
      return;
    } catch (error) {
      console.error('S3 fetch failed');
    }

    // 最后尝试
    if (url.startsWith('http')) {
      try {
        await proxyExternalUrl(url);
        console.log('=== Proxy completed ===\n');
        return;
      } catch (finalError) {
        console.error('Final attempt failed');
      }
    }

    throw new Error('Unable to retrieve image');

  } catch (error) {
    console.error('Proxy failed:', error.message);
    res.status(500).send('Error loading image');
  }
});

// 3. 其他路由
// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 在服务器启动时打印配置（注意不要在生产环境打印敏感信息）
console.log('AWS Configuration:', {
  bucket: process.env.AWS_BUCKET_NAME,
  region: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

// 添加常量定义在文件顶部
const TEST_KAIIN_CODE = '91';  // 测试用诊所代码，后续会改为动态获取

// API接口：获取患者列表
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        k.kanri_no,
        k.name,
        k.name2,
        DATE_FORMAT(k.updated_at, '%Y-%m-%d') as updated_date,
        m.name as status_name,
        k.tanto_name
      FROM t_kanja k
      LEFT JOIN m_chiryo_jotai m ON k.status = m.code
      WHERE k.kaiin_code = ${TEST_KAIIN_CODE}
      ORDER BY k.updated_at DESC
    `);

    const patients = rows.map(row => ({
      id: row.kanri_no,
      chartNumber: row.kanri_no,
      name: `${row.name}${row.name2 || ''}`,
      lastUpdate: row.updated_date,
      status: row.status_name || '未設定',
      doctor: row.tanto_name,
      symptom: ''
    }));

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取下一可用的カルテ番号
app.get('/api/next-chart-number', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT MAX(CAST(kanri_no AS UNSIGNED)) as max_number 
      FROM t_kanja 
      WHERE k.kaiin_code = ${TEST_KAIIN_CODE}
    `);
    
    const maxNumber = rows[0].max_number || 0;
    const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
    
    res.json({ chartNumber: nextNumber });
  } catch (error) {
    console.error('Error getting next chart number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取患者详情
app.get('/api/patients/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        k.kanri_no,
        k.name,
        k.name2,
        DATE_FORMAT(k.updated_at, '%Y-%m-%d') as updated_date,
        m.name as status_name,
        k.tanto_name
      FROM t_kanja k
      LEFT JOIN m_chiryo_jotai m ON k.status = m.code
      WHERE k.kanri_no = ? AND k.kaiin_code = ${TEST_KAIIN_CODE}
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = {
      id: rows[0].kanri_no,
      chartNumber: rows[0].kanri_no,
      name: `${rows[0].name}${rows[0].name2 || ''}`,
      lastUpdate: rows[0].updated_date,
      status: rows[0].status_name || '未設定',
      doctor: rows[0].tanto_name,
      symptom: '',
      medicalRecords: []
    };

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取患者的图像列表
app.get('/api/patients/:id/images', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        i.img_url,
        i.created_at,
        i.img_id,
        i.annotations,
        k.pid,
        k.kanri_no
      FROM t_image_list i
      INNER JOIN t_kanja k ON i.pid = k.pid
      WHERE k.kanri_no = ? 
        AND k.kaiin_code = ${TEST_KAIIN_CODE} 
        AND i.img_type = 3
      ORDER BY i.created_at DESC
    `, [req.params.id]);

    const images = rows.map(row => {
      let parsedAnnotations;
      try {
        parsedAnnotations = row.annotations ? JSON.parse(row.annotations) : [];
        if (typeof parsedAnnotations === 'string') {
          parsedAnnotations = JSON.parse(parsedAnnotations);
        }
      } catch (e) {
        console.error('Error parsing annotations:', e);
        parsedAnnotations = [];
      }

      // 始终返回代URL
      return {
        id: row.img_id,
        url: `/api/images/proxy/${row.img_id}`,
        uploadTime: new Date(row.created_at).toISOString().split('T')[0],
        annotations: parsedAnnotations
      };
    });

    res.json(images);
  } catch (error) {
    console.error('Error fetching patient images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 修改保存图片的API
app.post('/api/patients/:id/images', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  
  console.log(`\n=== Image Upload Started for Patient ${req.params.id} ===`);

  try {
    const { id } = req.params;
    const file = req.file;
    let annotations = req.body.annotations;

    if (!file) {
      throw new Error('No image file provided');
    }

    await connection.beginTransaction();

    // 1. 查询患者信息
    const [pidRows] = await connection.execute(
      'SELECT pid, name FROM t_kanja WHERE kanri_no = ? AND kaiin_code = ?',
      [id, TEST_KAIIN_CODE]
    );
    
    if (pidRows.length === 0) {
      throw new Error(`Patient not found: ${id}`);
    }

    const pid = pidRows[0].pid;

    // 2. 插入t_record_kanri
    const recordName = `画像記録_${new Date().toISOString().split('T')[0]}`;
    const [recordResult] = await connection.execute(`
      INSERT INTO t_record_kanri (name, pid, kaiin_code, created_at) 
      VALUES (?, ?, ?, NOW())
    `, [recordName, pid, TEST_KAIIN_CODE]);

    const rid = recordResult.insertId;

    // 3. 上传到S3
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const key = `users/${TEST_KAIIN_CODE}/${year}/${month}/${Date.now()}-${file.originalname}`;

    const uploadResult = await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }).promise();

    // 4. 插入t_image_list
    const [imageResult] = await connection.execute(`
      INSERT INTO t_image_list (rid, pid, img_type, img_url, proc_flg, annotations, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [rid, pid, 3, uploadResult.Location, 'N', annotations]);

    await connection.commit();
    console.log('=== Image Upload Completed ===\n');

    res.json({
      success: true,
      imageId: imageResult.insertId,
      url: `/api/images/proxy/${imageResult.insertId}`
    });

  } catch (error) {
    await connection.rollback();
    console.error('Upload failed:', error.message);
    res.status(500).json({
      error: 'Failed to save image',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// 添加S3上传测试
app.get('/api/test-s3', async (req, res) => {
  try {
    // 测试上传小文件
    const testResult = await s3.putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: 'test.txt',
      Body: 'Hello World'
    }).promise();
    
    console.log('S3 test upload successful:', testResult);
    res.json({ success: true });
  } catch (error) {
    console.error('S3 test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 添加健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Server is accessible at: http://0.0.0.0:${port}`);
});