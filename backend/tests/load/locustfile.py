# pyright: reportUnknownVariableType=none
from locust import HttpUser, between, task


class FileSystemUser(HttpUser):
    wait_time = between(1, 2.5)

    @task
    def list_directory(self):
        # Simulate listing the root directory
        self.client.post("/api/v1/fs/list", json={"path": "/"})

    @task(3)
    def list_deep_directory(self):
        # Simulate listing a deeper directory
        self.client.post("/api/v1/fs/list", json={"path": "/tmp"})
