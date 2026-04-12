import { useState } from "react";
import './taskbar.css'

function Taskbar(){

    return(
        <>
        <div className="taskbar-main" id="task-bar">
            <div className="tb-items">
                <div className="tb-item-box">
                    <div className="tb-icon">
                        {/* <img src="" alt="" /> */}
                    </div>

                </div>
                <div className="tb-item-box">
                    <div className="tb-icon">
                        {/* <img src="" alt="" /> */}
                    </div>

                </div>
                
                <div className="tb-item-box">
                    <div className="tb-icon">
                        {/* <img src="" alt="" /> */}
                    </div>

                </div>
                <div className="tb-item-box">
                    <div className="tb-icon">
                        {/* <img src="" alt="" /> */}
                    </div>

                </div>
                
            </div>
        </div>
        </>
    )
}

export default Taskbar;