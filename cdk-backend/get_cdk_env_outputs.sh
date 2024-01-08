#!/bin/bash
# Get CDK Output values to put into the frontend via a .env file, after the CDK has been deployed

API_URL=$(aws cloudformation describe-stacks --stack-name QASMBackendStack --query "Stacks[0].Outputs[?OutputKey=='LambdaAPIURLOutput'].OutputValue" --output text)
echo "REACT_APP_API_URL=$API_URL" > ../react-frontend/cdk.env