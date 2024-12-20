module.exports = {
    apps: [
      {
        name: 'dental-frontend',
        cwd: '/home/tourai2213/dentalbrain-v2',
        script: 'npm',
        args: 'run dev -- --host',
        env: {
          NODE_ENV: 'production',
          PORT: 5174
        },
        watch: false,
        ignore_watch: ['node_modules', 'logs'],
        max_memory_restart: '1G',
        error_file: '/home/tourai2213/dentalbrain-v2/logs/frontend-error.log',
        out_file: '/home/tourai2213/dentalbrain-v2/logs/frontend-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        autorestart: true,
        exp_backoff_restart_delay: 100,
        kill_timeout: 3000,
        wait_ready: true,
        listen_timeout: 5000
      },
      {
        name: 'dental-backend',
        cwd: '/home/tourai2213/dentalbrain-v2/backend',
        script: 'server.js',
        env: {
          NODE_ENV: 'production',
          PORT: 3002
        },
        watch: ['server.js', 'src'],
        ignore_watch: ['node_modules', 'logs'],
        max_memory_restart: '1G',
        error_file: '/home/tourai2213/dentalbrain-v2/backend/logs/error.log',
        out_file: '/home/tourai2213/dentalbrain-v2/backend/logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        autorestart: true,
        exp_backoff_restart_delay: 100,
        kill_timeout: 3000,
        wait_ready: true,
        listen_timeout: 5000
      }
    ]
  };