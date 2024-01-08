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

app.synth()

