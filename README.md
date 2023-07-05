# Getting Started with QASM

Welcome to the Quality Assurance State Machine (QASM)! QASM is a single-serve web application that runs
using React and Electron, with the ability to run customizable QA jobs locally or via a statically hosted S3 website.  

### Installation 

1) Navigate to the frontend and install necessary packages

        >> cd react-frontend
        >> npm install

2) The main app entrypoint is the python script ``react-frontend/QASM.py``. This script will launch the Electron app and serve the React app. It does require some python dependencies, which can be installed using:

        >> pip install -r requirements.txt
        
3) The app can be run locally using

        >> npm run qasm

    This will launch an app based on the specifications found in ``react-frontend/config.json`` if present, else it will copy ``react-frontend/default-config.json``, load it, and save it to ``react-frontend/config.json``. 

    Note that for any backend functionality that requires AWS (ie running in `"s3"` mode), you will need to have AWS credentials set up on your machine. See [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) for more information. 

    Once your AWS credentials are set, you will need to deploy the backend to AWS using [Terraform](#terraform).

4) To create a Windows executable of the current configuration, run

        >> npm run qasm-build

    Which will deposit the executable in ``react-frontend/dist``. Note that this will only work on Windows machines.

5) To run using a specific configuration file, use

        >> npm run qasm -- --config_path <path/to/config.json>

### Configuration

``react-frontend/config.json`` expects the following fields:

- ``"app": <string>``
    - ``"s3"`` for an app that runs using AWS Cloud resources managed by [Terraform](#terraform).
    - ``"local"`` for an app that runs using local files

- ``"bucket": <string>``
    - Name of the s3 bucket from which to pull data (only required for ``"app": "s3"``)

- ``"name": <string>``
    - (Optional) Display name of the app

- ``"components": <Array>`` Array of component config objects. Order of the components is the order they appear in the toolbar
    - Required for all components:
        - ``"component": <string>`` One of the following component names:
            - ``"grid"`` for a grid of images, and the ability to label each image as a single class type
            - ``"multiclassgrid"`` for a grid of images that supports multiple class types per image
            - ``"imagelabeler"`` for a [ULabel](https://github.com/SenteraLLC/ulabel) image labeling tool
            - ``"binaryeditor"`` for a binary image editor, where simple dilation and erosion operations can be performed

    - Optional for all components:
        - ``"display_name": <string>`` Change the navbar display name


    - ``"grid"`` Configuration ``<Object>``:
        - ``"grid_width": <Number>`` Default number of images to show per row
        - ``"classes": <Array>``
            - ``<Object>`` with class details
                - ``"class_name": <string>`` (Required) Custom name for a class
                - ``"svg_overlay": <string>`` (Optional) Name of the class overlay
                    - ``"x_overlay"`` for a big red 'X'
                    - ``"sparse"`` for very spaced out dots (*Color options not implemented*)
                    - ``"criss_cross"`` for grid of criss crossing lines (*Color options not implemented*)
                    - ``"curved"`` for curved lines (*Color options not implemented*)
                    - ``"field_edge"`` for parallel lines next to a blob of vegetation (*Color options not implemented*)
                    - ``null`` for nothing
                - ``"color": <string>`` (Optional) Color of overlay
                    - ``"red"`` red
                    - ``"yellow"`` yellow
                    - ``"white"`` white
                    - ``"green"`` green
        - ``"label_loadnames": <Array[string]>`` (Optional) An ordered list of label filenames to automatically try and load. Will search one folder above the current directory.
        - ``"autoload_labels_on_dir_select": <boolean>`` (Optional) Whether to try and autoload labels after each new directory selection. Default is false. Can also be changed in app via the checkbox "Autoload Labels on Directory Select". Default is false.
        - ``"image_layer_folder_names": Array[Array[<string>], ...]``: (Optional) Ordered list of folder names of image layers to automatically try and load when a directory is selected. Supports having multiple anticipated folder names. Eg, for an input shown below, the first set of `_thumbnails` layers will try and load, and if any of them are not present, it will instead load the next Array of folders.
            ```js
            "image_layer_folder_names": [
                [
                    "bottom_thumbnails",
                    "nadir_thumbnails",
                    "oblique_thumbnails"
                ],
                [
                    "bottom",
                    "nadir",
                    "oblique"
                ]
            ]
            ```

    - ``"multiclassgrid"`` Configuration ``<Object>``:
        - ``"grid_width": <Number>`` Default number of images to show per row
        - ``"classes": <Array>``
            - ``<string>: <Object>`` class type with class details object
                - ``"class_values": <Array[string]>`` (Required) List of class values within the class type
                - ``"selector_type": <string>`` (Required) Method of selecting between class values in app
                    - ``"radio"`` Radio buttons
                    - ``"checkbox"`` Checkboxes
                - ``"default": <string>`` (Optional) Default class value for this class type. Must be one of the class_values.
                - ``"class_colors": <Object>`` (Optional) Text colors used in the class selector
                    - ``<string>: <string>`` The key must be one of the class_values. The value must be a valid css color (name or hexcode).
                        - Ex: to make the class_value `"Normal"` appear in blue text, ``"Normal": "blue"``
                - ``"class_overlays": <boolean>`` (Optional) Whether to have an "X" appear in the bottom left of every class that has an assigned `class_color`
        - ``"label_savenames": <Object>`` (Optional) Define custom buttons that will allowing saving to a custom filename.
            - ``<string>: <string>`` Where the key is the name that will appear on the button and the value is the filename.
        - ``"label_loadnames": <Array[string]>`` (Optional) An ordered list of label filenames to automatically try and load. Will search one folder above the current directory.
        - ``"autoload_labels_on_dir_select": <boolean>`` (Optional) Whether to try and autoload labels after each new directory selection. Default is false. Can also be changed in app via the checkbox "Autoload Labels on Directory Select". Default is false.
        - ``"image_layer_folder_names": Array[Array[<string>], ...]``: (Optional) Ordered list of folder names of image layers to automatically try and load when a directory is selected. See ``"grid"`` for more details.
                

    - ``"imagelabeler"`` Configuration ``<Object>``:
        - ``"subtasks": <Object>`` ULabel [subtasks](https://github.com/SenteraLLC/ulabel/blob/044c24072fe00a30b89e0f370fb8d4ddad28b59d/api_spec.md#subtasks) definition(s) 
            - ``<string>: <Object>`` Custom subtask name, followed by the subtask definition object
                - ``"display_name": <string>`` Displayed subtask name
                - ``"classes": <Array>`` List of class definition objects
                    - ``<Object>`` Object with class definition
                        - ``"name": <string>`` Class name
                        - ``"color": <string>`` Class color
                        - ``"id": <Number`` Class id number
                - ``"allowed_modes: <Array>"`` List of allowed annotation modes
                    - ``"polyline":`` A simple series of points that needn't define a closed polygon
                    - ``"bbox":`` A simple single-frame bounding box
                    - ``"bbox3":`` A bounding box that can extend through multiple frames
                    - ``"polygon":`` A simple series of points that must define a closed polygon
                    - ``"tbar":`` Two lines defining a "T" shape
                    - ``"contour":`` A freehand line
                    - ``"whole-image":`` A label to be applied to an entire frame
                    - ``"global":`` A label to be applied to the entire series of frames
                    - ``"point":`` A keypoint within a single frame 
                - ``"resume_from": <string>`` (Optional) Key used in annotation jsons. Used to load in annotations from the annotation directory (*Use `null` for no anno loading`*)
        - ``"image_dir": <string>`` (Optional) Path to directory of images
        - ``"anno_dir": <string>`` (Optional) Path to directory of labels or annotations


    - ``"binaryeditor"`` Configuration ``<Object>``:
        - ``"dilate_keybind": <string>`` Change the dilation keybind. Defaults to "="
        - ``"erode_keybind": <string>`` Change the erosion keybind. Defaults to "-"


### Terraform
Terraform automatically takes our lambda code and deploys it to all the necessary AWS services (Lambda, API Gateway, IAM, etc) to allow our serverless applications to run.

Install Terraform (https://learn.hashicorp.com/tutorials/terraform/install-cli)

Start a new project or connect to an existing Terraform project

        >> cd terraform-backend
        >> terraform init

Note: Since S3 buckets are globally scoped (no two buckets can share the same name), you may need to change the bucket name in the terraform code. To do this, open the file ``terraform-backend/main.tf`` and change references to the bucket name ``qasm-lambdas`` to something unique.

To prevent developer testing from interfering with active users, we can utilize terraform 'workspaces' to keep development and production environments seperate.

To work in the development workspace, use

        >> terraform workspace select dev

And for production,

        >> terraform workspace select prod

Both workspaces use the same source code, but the prefix "${terraform.workspace}-" is added to every unique resource, so that the two workspaces deploy to seperate 'dev' and 'prod' AWS resources. When creating new resouces, be sure to add this prefix so as to avoid hidden dependencies.


To deploy changes to a Terraform project, use

        >> terraform apply

You will be shown a summary of the changes that terraform will be applying, so be sure to double check that (a) you are on the desired workspace and (b) that you aren't accidentily destroying unexpected resources. To check what workspace you are in, you can use 

        >> terraform workspace list


Once changes have been tested in development and are ready to be applied to the production resources, these changes are applied by simply switching workspaces and running the apply command. 

        >> terraform workspace select prod
        >> terraform apply
