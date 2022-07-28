import { Component } from 'react';
import "../css/GridImage.css";
import x_overlay from "../icons/x.svg";
 
class GridImage extends Component {
    image = "";
    image_name = "";
    classes = [];

    constructor(props) {
        super(props);

        // Initialize props
        this.image        = props.image;
        this.image_name   = props.image_name;
        this.classes      = props.classes;
        this.css_by_class = props.css_by_class;

        // Use state to store current class
        let default_class = props.default_class || this.classes[0] // Default to first class
        this.state = {
            class: default_class
        };

        // Bind functions
        this.changeClass = this.changeClass.bind(this);
    }

    changeClass() {
        // Cycle through all classes
        let class_name;
        let idx = this.classes.indexOf(this.state.class);
        for (idx;  idx < this.classes.length; idx++) {
            class_name = this.classes[idx];
            if (class_name !== this.state.class) {
                this.setState({
                    class: class_name
                });
                
                // console.log("Changed " + this.image_name + " to " + this.state.class);
                break;
            } else if (idx+1 === this.classes.length) {
                idx = -1;
            }
        }
    }

    /** 
     * This method loop through all of the x-overlays and updates them to
     * be the same size as the image they overlay.
     * 
     * TODO: this method should support multiple diffrent overlays, not 
     * just the x-overlay.
    */
    update_overlay() {
        let all_overlays = document.getElementsByClassName("x-overlay")

        if (all_overlays.length === 0) {
            return
        }

        // Loop through every overlay and resize them to fit on their image
        for (let current_overlay of all_overlays) {

            // Grab the current overlay's sibling image
            const image = current_overlay.nextElementSibling;

            // Set the overlay's width and height to the image's displayed width and height
            current_overlay.width  = image.clientWidth;
            current_overlay.height = image.clientHeight;
        }
    }
    
    render() {
        this.update_overlay();
        return (
            <div 
                className={"GridImage " + this.state.class}
                onClick={this.changeClass}
                style={this.css_by_class[this.state.class]}
                id={this.image_name}
            >
                <div>
                    <img src={x_overlay} className="x-overlay" alt={this.image_name + " overlay"}></img>
                    <img src={this.image} alt={this.image_name}></img>
                </div>
                {/* <div style={this.css_by_class[this.state.class]}></div> */}
                <p>{this.image_name}</p>
            </div>        
        )
    }
}

export default GridImage;