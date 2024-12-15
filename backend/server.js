const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// 配置 AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

app.use(cors());
app.use(express.json());

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

// 获取下一个可用的カルテ番号
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
        // 确保解析JSON字符串为对象
        parsedAnnotations = row.annotations ? JSON.parse(row.annotations) : [];
        // 如果解析后仍然是字符串，再次解析
        if (typeof parsedAnnotations === 'string') {
          parsedAnnotations = JSON.parse(parsedAnnotations);
        }
      } catch (e) {
        console.error('Error parsing annotations:', e);
        parsedAnnotations = [];
      }

      return {
        id: row.img_id,
        url: row.img_url,
        uploadTime: new Date(row.created_at).toISOString().split('T')[0],
        annotations: parsedAnnotations  // 使用解析后的对象
      };
    });

    console.log('Sending processed images:', JSON.stringify(images, null, 2));
    res.json(images);
  } catch (error) {
    console.error('Error fetching patient images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 添加保存图片的API
app.post('/api/patients/:id/images', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { annotations } = req.body;
    const file = req.file;

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. 先获取患者的pid
      const [pidRows] = await connection.execute(
        'SELECT pid FROM t_kanja WHERE kanri_no = ? AND kaiin_code = ?',
        [id, TEST_KAIIN_CODE]
      );
      
      if (pidRows.length === 0) {
        throw new Error('Patient not found');
      }
      const pid = pidRows[0].pid;

      // 2. 先插入t_record_kanri获取rid
      const [recordResult] = await connection.execute(`
        INSERT INTO t_record_kanri (
          name,
          pid,
          kaiin_code,
          created_at
        ) VALUES (
          DATE_FORMAT(NOW(), '%Y-%m-%d'),
          ?,
          ?,
          NOW()
        )
      `, [pid, TEST_KAIIN_CODE]);

      const rid = recordResult.insertId;

      // 3. 到S3获取URL
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
        INSERT INTO t_image_list (
          rid,
          pid,
          img_type,
          img_url,
          proc_flg,
          annotations,
          created_at
        ) VALUES (?, ?, 3, ?, 'N', ?, NOW())
      `, [rid, pid, uploadResult.Location, JSON.stringify(annotations)]);

      const img_id = imageResult.insertId;

      // 提交事务
      await connection.commit();

      res.json({
        success: true,
        imageId: img_id,
        url: uploadResult.Location
      });

    } catch (error) {
      // 如果出错，回滚事务
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Upload error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      error: 'Failed to save image',
      details: error.message,
      code: error.code
    });
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

// 删除图片API
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

// 添加图片代理路由
app.get('/api/images/proxy/:imageId', async (req, res) => {
  try {
    // 1. 获取图片信息
    const [rows] = await pool.execute(
      'SELECT img_url FROM t_image_list WHERE img_id = ?',
      [req.params.imageId]
    );

    if (rows.length === 0) {
      return res.status(404).send('Image not found');
    }

    // 2. 从S3获取图片
    const url = rows[0].img_url;
    const key = url.split('.amazonaws.com/')[1];
    
    const s3Object = await s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    }).promise();

    // 3. 设置正确的Content-Type
    res.setHeader('Content-Type', s3Object.ContentType);
    // 4. 发送图片数据
    res.send(s3Object.Body);

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).send('Error loading image');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Frontend URL:', 'http://localhost:5174');
});