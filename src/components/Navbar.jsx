import React from "react";
import icon from "../assets/icon.png";
import back from "../assets/back.png";
import gear from "../assets/gear.png";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const pathname = useLocation().pathname;
  const isSettings = pathname === "/settings";
  const navigate = useNavigate();
  return (
    <div className="navbar">
        
      <div className="nav-group">
        <a href="https://preactjs.com" target="_blank">
          <img src={icon} className="logo preact" alt="Preact logo" />
        </a>
      <h1>TabTrail</h1>
      </div>

      {
        !isSettings && (
          <div>
            <div onClick={() => navigate("/settings")}>
              <img src={gear} className="logo preact" alt="gear logo"  style={{
                  width: "20px",
                  height: "20px",
              }}/>
            </div>
          </div>
        )
      }

    </div>
  );
};

export default Navbar;
