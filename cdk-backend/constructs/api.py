"""API Constructs."""
from constructs import Construct
from aws_cdk import (
    aws_apigateway as apigw,
    aws_apigatewayv2 as apigw_v2,
    aws_apigatewayv2_integrations as apigw_v2_integrations,
    aws_lambda as lambda_,
    aws_lambda_python_alpha as lambda_python,
    aws_wafv2 as wafv2
)
from pathlib import Path

class LambdaWithAPIIntegration(Construct):
    """
    Lambda function with API Gateway integration.
    
    Designed to work with REST APIs.
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
    ):
        """
        Init.
        
        :param scope: CDK scope.
        :param construct_id: CDK construct ID.
        """
        super().__init__(scope, construct_id)