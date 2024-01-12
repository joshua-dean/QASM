"""QASM Backend stack."""
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_iam as iam,
    aws_s3 as s3,
    aws_apigateway as apigw,
    aws_apigatewayv2 as apigw_v2,
    aws_apigatewayv2_integrations as apigw_v2_integrations,
    aws_lambda as lambda_,
    aws_lambda_python_alpha as lambda_python,
    aws_wafv2 as wafv2,
)
from constructs import Construct
from pathlib import Path

class QASMBackendStack(Stack):
    """QASM backend stack."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        """Init."""
        super().__init__(scope, construct_id, **kwargs)
        
        ASTRIN_IP = "204.26.121.22"
        
        # Data labeling bucket
        self.data_labeling_bucket = s3.Bucket(
            self,
            "QASMDataLabelingBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            auto_delete_objects=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        
        # Static site bucket
        self.static_site_bucket = s3.Bucket(
            self,
            "QASMStaticSiteBucket",
            removal_policy=cdk.RemovalPolicy.DESTROY,
            # block_public_access=s3.BlockPublicAccess(
            #     block_public_acls=True,
            #     block_public_policy=True,
            #     ignore_public_acls=True,
            #     restrict_public_buckets=False,
            # ),
            auto_delete_objects=True,
            website_index_document="index.html",
            website_error_document="index.html",
            public_read_access=True
        )

        # Lambda bucket
        self.lambda_bucket = s3.Bucket(
            self,
            "QASMLambdaBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        self.lambda_api = apigw.RestApi(
            self,
            "QASMLambdaAPI",
            rest_api_name="QASMLambdaAPI",
            description="API for QASM Lambda functions",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=10,
                throttling_burst_limit=100,
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["*"],
            ),
        )
        # self.lambda_api = apigw_v2.HttpApi(
        #     self,
        #     "QASMLambdaAPI",
        #     cors_preflight=apigw_v2.CorsPreflightOptions(
        #         allow_origins=["*"],
        #         allow_methods=[
        #             apigw_v2.CorsHttpMethod.OPTIONS,
        #             apigw_v2.CorsHttpMethod.PUT,
        #             apigw_v2.CorsHttpMethod.POST,
        #             apigw_v2.CorsHttpMethod.GET,
        #         ],
        #         allow_headers=["*"],
        #     ),
        # )

        # self.lambda_api_stage = apigw_v2.HttpStage(
        #     self,
        #     "QASMLambdaAPIStage",
        #     stage_name="prod",
        #     auto_deploy=True,
        #     http_api=self.lambda_api,
        # )
        
        
        repo_root = Path(__file__).parent.parent.parent
        lambda_code_path = repo_root / "terraform-backend" / "lambdas"
        
        # Lambda functions
        lambda_handlers: list[str] = [
            "s3_browser.open_dir",
            "s3_browser.get_signed_urls_in_folder",
            "s3_browser.get_base64_images_in_folder",
            "s3_browser.save_labels",
            "s3_browser.load_labels",
            "s3_browser.load_image",
            "s3_browser.save_image",
            "s3_browser.get_cascading_dir_children",
            "s3_browser.get_folder_content"
        ]
        
        self.lambda_functions: list[lambda_python.PythonFunction] = []
        for lambda_handler_str in lambda_handlers:
            index_name, handler = lambda_handler_str.split(".")
            fn_construct_id = f"{handler}Lambda"
            lambda_fn = lambda_python.PythonFunction(
                self,
                fn_construct_id,
                entry=str(lambda_code_path),
                index=f"{index_name}.py",
                handler=handler,
                runtime=lambda_.Runtime.PYTHON_3_8,
                # environment={
                #     "BUCKET_NAME": self.lambda_bucket.bucket_name,
                # },
            )
            
            self.data_labeling_bucket.grant_read_write(lambda_fn)
            
            # API Gateway integration
            _integration = apigw.LambdaIntegration(
                lambda_fn,
                proxy=False,
                integration_responses=[
                    apigw.IntegrationResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": "'*'",
                        },
                    ),
                ],
            )
            self.lambda_api.root.add_resource(handler).add_method(
                "POST",
                _integration,
                method_responses=[
                    apigw.MethodResponse(
                        status_code="200",
                        response_parameters={
                            "method.response.header.Access-Control-Allow-Origin": True,
                        },
                    )
                ],
            )
            # _integration = apigw_v2_integrations.HttpLambdaIntegration(
            #     id=f"QASM{handler}Integration",
            #     handler=lambda_fn,
            # )
            """
            Setting methods to ALL or including OPTIONS
            will have preflight requests go the Lambda function.
            Unless custom handling is required, this is not necessary.
            If a function isn't designed to accomodate this (returning 200),
            then the preflight request will fail and the request will be blocked with a CORS error.
            """
            # self.lambda_api.add_routes(
            #     path=f"/{handler}",
            #     methods=[apigw_v2.HttpMethod.POST],
            #     integration=_integration,
            # )
            
            self.lambda_functions.append(lambda_fn)
        
        # Won't work with plain HTTP API, needs to be REST
        # self.web_acl = wafv2.CfnWebACL(
        #     self,
        #     "QASMWebACL",
        #     default_action=wafv2.CfnWebACL.DefaultActionProperty(
        #         block={}
        #     ),
        #     scope="REGIONAL",
        #     visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
        #         cloud_watch_metrics_enabled=True,
        #         metric_name="QASMWebACL",
        #         sampled_requests_enabled=True,
        #     ),
        #     rules=None
        # )
        
        # self.web_acl_association = wafv2.CfnWebACLAssociation(
        #     self,
        #     "QASMWebACLAssociation",
        #     resource_arn=self.lambda_api.deployment_stage
        #     web_acl_arn=self.web_acl.attr_arn
        # )
        
        
        self.env_outputs: list[cdk.CfnOutput] = [
            cdk.CfnOutput(
                self,
                "QASMDataLabelingBucketOutput",
                value=self.data_labeling_bucket.bucket_name,
                description="Data labeling bucket",
            ),
            cdk.CfnOutput(
                self,
                "QASMStaticSiteBucketOutput",
                value=self.static_site_bucket.bucket_name,
                description="Static site bucket",
            ),
            cdk.CfnOutput(
                self,
                "QASMLambdaAPIURLOutput",
                value=self.lambda_api.url,
                description="Lambda API URL",   
            ),
        ]


        
        