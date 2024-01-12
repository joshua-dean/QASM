"""Script to populate the QASM config file with necessary CDK outputs."""
from __future__ import annotations
import json
import boto3
from pathlib import Path
from dataclasses import dataclass

from mypy_boto3_cloudformation.type_defs import StackTypeDef

@dataclass
class CDKOutputMap:
    """Map from a CDK output to a QASM config file key."""
    cdk_output_key: str
    qasm_config_key: str
    
REPO_ROOT = Path(__file__).parent.parent.parent
QASM_CONFIG_FILE_PATH = REPO_ROOT / "react-frontend" / "config.json"

if __name__ == "__main__":
    """
    Current this finds a single stack by name and retrieves the outputs to populate the config.
    This will need modifications to work with multiple stacks at the same time.
    """
    stack_name = "QASMBackendStack"
    cdk_output_maps: list[CDKOutputMap] = [
        # This one isn't used
        # CDKOutputMap(
        #     cdk_output_key="QASMLambdaAPIURLOutput",
        #     qasm_config_key="lambda_api_url"
        # ),
        CDKOutputMap(
            cdk_output_key="QASMStaticSiteBucketOutput",
            qasm_config_key="static_site_bucket"
        ),
        CDKOutputMap(
            cdk_output_key="QASMDataLabelingBucketOutput",
            qasm_config_key="bucket"
        )
    ]

    cloudformation_client = boto3.client("cloudformation")
    
    desc_stacks_resp = cloudformation_client.describe_stacks(
        StackName=stack_name
    )
    assert len(desc_stacks_resp["Stacks"]) == 1
    
    backend_stack: StackTypeDef = desc_stacks_resp["Stacks"][0]
    outputs = backend_stack["Outputs"]
    
    qasm_config: dict = json.loads(QASM_CONFIG_FILE_PATH.read_text())
    for cdk_output_map in cdk_output_maps:
        qasm_config[cdk_output_map.qasm_config_key] = next(
            output["OutputValue"] for output in outputs if output["OutputKey"] == cdk_output_map.cdk_output_key
        )
    
    QASM_CONFIG_FILE_PATH.write_text(json.dumps(qasm_config, indent=4))
    
    
        
    
    