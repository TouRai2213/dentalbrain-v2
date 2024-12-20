module.exports = {
    apps: [{
      name: 'dental-backend',
      script: 'server.js',
      watch: ['server.js', 'src'],  // 只监视这些目录
      ignore_watch: ['logs', 'node_modules'],  // 忽略这些目录的变化
      watch_options: {
        followSymlinks: false
      },
      max_memory_restart: '2G'
    }]
  }