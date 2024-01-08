from aws_cdk import (
    Stack,
    aws_s3 as s3
)
from constructs import Construct

class QASMBackendStack(Stack):
    """QASM backend stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ) -> None:
        """Init."""
        super().__init__(scope, construct_id, **kwargs)
        
        # Lambda bucket
        self.lambda_bucket = s3.Bucket(
            self,
            "LambdaBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
