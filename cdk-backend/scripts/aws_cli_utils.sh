#!/bin/bash
# AWS CLI utilities, specifically for use adjacent to the CDK
#
# Args:
#   $1: The name of the stack to get outputs from
#   $2: The name of the output to get
function get_cdk_output() {
    aws cloudformation describe-stacks \
        --stack-name $1 \
        --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" \
        --output text
}