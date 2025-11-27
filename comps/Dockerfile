FROM python:3.12-slim

# Set proxy environment variables for Intel network
ENV http_proxy=http://proxy-dmz.intel.com:912
ENV https_proxy=http://proxy-dmz.intel.com:912
ENV HTTP_PROXY=http://proxy-dmz.intel.com:912
ENV HTTPS_PROXY=http://proxy-dmz.intel.com:912
ENV no_proxy=127.0.0.1,localhost,intel.com,.intel.com,g2-wyn04.iind.intel.com
ENV NO_PROXY=127.0.0.1,localhost,intel.com,.intel.com,g2-wyn04.iind.intel.com
# Set working directory to parent so 'comps' is importable
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file from comps directory
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire comps directory
COPY . ./comps

# Create output directory
RUN mkdir -p out

# Expose port
EXPOSE 8050

# Set environment variables - PYTHONPATH points to /app so 'comps' module is found
ENV PYTHONPATH=/app

# Run the application from comps directory
WORKDIR /app/comps
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8050"]
