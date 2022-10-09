import { Component } from "react";
import "../css/Dropdown.css";

class Dropdown extends Component {
    invalid = false;
    invalid_props = [];

    constructor(props) {
        super(props);

        this.items        = props.items;        // Required
        this.callback     = props.callback;     // Required
        this.style        = props.style;        // Optional
        this.display_text = props.display_text; // Optional

        // Make sure that items both exists and is an array with at least one item
        try {
            if (this.items.constructor !== Array || this.items.length === 0) {
                this.invalid = true;
                this.invalid_props.push("props.items");
            }
        }
        catch {
            this.invalid = true;
            this.invalid_props.push("props.items");
        }
        
        // Check if display text was given, if not use the default
        if (this.display_text === undefined) {
            this.display_text = "▶"
        }
    }


    render() {
        if (this.invalid) {
            return (
                <div>
                    This component was either missing or given the following invalid props:
                    <br/ >
                    {this.invalid_props}
                </div>
            )
        }
        return (
            <div className="Dropdown">
                <button className="toggle-display">
                    {this.display_text}
                </button>
                <div className="dropdown-content">

                </div>
            </div>
        )
    }
}

export default Dropdown