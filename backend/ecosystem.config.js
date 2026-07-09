module.exports = {
  apps: [{
    name: "Slink FastAPI Backend",
    script: "venv/bin/python",
    args: "-m uvicorn main:app --host 0.0.0.0 --port 4793",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
  }]
}
