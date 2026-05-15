FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (for ReportLab, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e ".[dev]" || pip install --no-cache-dir -e .

# Copy source
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "nyayamitra.main:app", "--host", "0.0.0.0", "--port", "8000"]
