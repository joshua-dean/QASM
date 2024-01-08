#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.qasm_backend_stack import QASMBackendStack
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent

app = cdk.App()
qasm_backend_stack = QASMBackendStack(
    app,
    "QASMBackendStack",
)

# .env file generation
env_file_path = REPO_ROOT / "react-frontend" / "cdk.env"
env_file_path.touch()
env_file_path.write_text(
    f"REACT_APP_API_URL={qasm_backend_stack.lambda_api_url}\n"
)

app.synth()
