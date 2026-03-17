FROM python:3.13-slim
RUN pip install --no-cache-dir matplotlib numpy
WORKDIR /work
ENTRYPOINT ["python3", "analysis/process_results.py"]
