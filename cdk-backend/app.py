#!/usr/bin/env python3
import aws_cdk as cdk

from stacks.qasm_backend_stack import QASMBackendStack

app = cdk.App()
QASMBackendStack(
    app,
    "QASMBackendStack",
)

app.synth()
