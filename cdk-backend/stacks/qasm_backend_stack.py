from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_apigatewayv2 as apigw_v2,
)
from constructs import Construct


class QASMBackendStack(Stack):
    """QASM backend stack."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        """Init."""
        super().__init__(scope, construct_id, **kwargs)

        # Lambda bucket
        self.lambda_bucket = s3.Bucket(
            self, "LambdaBucket", block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        self.lambda_api = apigw_v2.HttpApi(
            self,
            "LambdaAPI",
            cors_preflight=apigw_v2.CorsPreflightOptions(
                allow_origins=["*"],
                allow_methods=[
                    apigw_v2.CorsHttpMethod.OPTIONS,
                    apigw_v2.CorsHttpMethod.PUT,
                    apigw_v2.CorsHttpMethod.POST,
                    apigw_v2.CorsHttpMethod.GET,
                ],
                allow_headers=["*"],
            ),
        )

        self.lambda_api_stage = apigw_v2.HttpStage(
            self,
            "LambdaAPIStage",
            stage_name="prod",
            auto_deploy=True,
            http_api=self.lambda_api,
        )
        self.lambda_api_url = self.lambda_api.url
