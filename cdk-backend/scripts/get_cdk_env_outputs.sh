#!/bin/bash
# Get CDK Output values to put into the frontend via a .env file, after the CDK has been deployed

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source $SCRIPT_DIR/aws_cli_utils.sh

API_URL=$(get_cdk_output QASMBackendStack QASMLambdaAPIURLOutput)
STATIC_SITE_S3_BUCKET=$(get_cdk_output QASMBackendStack QASMStaticSiteBucketOutput)
DATA_LABELING_S3_BUCKET=$(get_cdk_output QASMBackendStack QASMDataLabelingBucketOutput)

echo "REACT_APP_API_URL=$API_URL
STATIC_SITE_S3_BUCKET=$STATIC_SITE_S3_BUCKET
DATA_LABELING_S3_BUCKET=$DATA_LABELING_S3_BUCKET" > ../react-frontend/cdk.env

cp ../react-frontend/cdk.env ../react-frontend/.env
