#!/bin/bash
# Uploads test data to the S3 bucket provisioned by the CDK for data labeling

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source $SCRIPT_DIR/aws_cli_utils.sh

DATA_LABELING_S3_BUCKET=$(get_cdk_output QASMBackendStack QASMDataLabelingBucketOutput)

aws s3 cp $SCRIPT_DIR/../test_data/ s3://$DATA_LABELING_S3_BUCKET --recursive 