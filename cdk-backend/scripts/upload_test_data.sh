#!/bin/bash
# Uploads test data to the S3 bucket provisioned by the CDK for data labeling

source ./aws_cli_utils.sh

DATA_LABELING_S3_BUCKET=$(get_cdk_output QASMBackendStack QASMDataLabelingBucketOutput)

aws s3 cp ../test_data/ $DATA_LABELING_S3_BUCKET --recursive --exclude "*" --include "*.json"