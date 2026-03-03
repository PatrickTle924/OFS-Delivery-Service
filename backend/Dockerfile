FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostgreSQL (psycopg2)
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

COPY . .

EXPOSE 5000
# Run Flask with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]