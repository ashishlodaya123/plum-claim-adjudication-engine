# Running Docker in WSL Instead of Docker Desktop

This guide explains how to set up and run the PlumHQ Automated Medical Claim Adjudication System using Docker in WSL (Windows Subsystem for Linux) instead of Docker Desktop. This approach avoids issues with Docker Desktop shutting down unexpectedly.

## Prerequisites

1. Windows 10/11 with WSL2 installed
2. Ubuntu 20.04 or later installed in WSL
3. At least 4GB RAM allocated to WSL

## Step-by-Step Instructions

### 1. Install WSL (if not already installed)

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

Restart your computer when prompted.

### 2. Update WSL Kernel

```powershell
wsl --update
```

### 3. Install Ubuntu (if not already installed)

```powershell
wsl --install -d Ubuntu
```

### 4. Configure WSL Resources

Create or edit `.wslconfig` in your Windows user profile directory (`C:\Users\{YourUsername}\.wslconfig`):

```ini
[wsl2]
memory=4GB
processors=2
localhostForwarding=true
```

Restart WSL after making changes:

```powershell
wsl --shutdown
```

### 5. Install Docker in WSL

Open Ubuntu in WSL and run the following commands:

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
sudo apt-get update

# Install Docker Engine
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to the docker group
sudo usermod -aG docker $USER

# Start Docker daemon
sudo service docker start
```

### 6. Verify Docker Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Test Docker with hello-world
docker run hello-world
```

### 7. Configure Docker to Start Automatically

To automatically start Docker when WSL starts, add the following to your `~/.bashrc`:

```bash
# Auto-start Docker daemon
if service docker status 2>&1 | grep -q "is not running"; then
    echo "Starting Docker daemon..."
    sudo service docker start >/dev/null 2>&1
fi
```

Then reload your bash configuration:

```bash
source ~/.bashrc
```

### 8. Clone and Run the Project

Navigate to your desired directory and clone the repository:

```bash
git clone <repository_url>
cd plum-claim-adjudication-engine
```

Create a `.env` file based on the project requirements:

```bash
cp .env.example .env
# Edit the .env file to add your specific configuration
nano .env
```

Start the application using Docker Compose:

```bash
docker compose up --build
```

### 9. Access the Application

Once the containers are running, access the application at:

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000/docs`
- **MinIO Console:** `http://localhost:9001`
- **Prometheus:** `http://localhost:9090`
- **Grafana:** `http://localhost:3001`

### 10. Useful WSL Commands

```bash
# Start WSL
wsl

# Shutdown WSL (from PowerShell)
wsl --shutdown

# List WSL distributions
wsl --list --verbose

# Set default WSL version
wsl --set-default-version 2

# Export a distribution
wsl --export <DistributionName> <FileName>

# Import a distribution
wsl --import <DistributionName> <InstallLocation> <FileName>
```

### 11. Troubleshooting

#### Issue: Docker permission denied

Solution:

```bash
sudo chmod 666 /var/run/docker.sock
```

#### Issue: Port already in use

Solution:

```bash
# Check which process is using the port
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>
```

#### Issue: WSL runs out of memory

Solution: Increase memory allocation in `.wslconfig` file

#### Issue: Containers fail to start

Solution: Check logs and rebuild:

```bash
docker compose down
docker compose up --build
```

### 12. Stopping the Application

To stop the application:

```bash
# Press Ctrl+C in the terminal running docker compose

# Or stop from another terminal
docker compose down
```

### 13. Managing Docker Volumes and Images

Clean up unused volumes and images to free space:

```bash
# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune

# Remove stopped containers
docker container prune

# Remove everything (use with caution)
docker system prune -a
```

## Benefits of Using WSL Over Docker Desktop

1. **Better Performance**: Direct Linux kernel integration
2. **Resource Efficiency**: More efficient memory and CPU usage
3. **Stability**: Less prone to unexpected shutdowns
4. **Cost**: No licensing fees
5. **Integration**: Better integration with Linux development tools

## Notes

- File system performance is better when working within the WSL filesystem (`/home/username/`) rather than Windows filesystem (`/mnt/c/`)
- Changes to `.wslconfig` require a full WSL restart (`wsl --shutdown`)
- Docker volumes and images are stored within the WSL distribution
