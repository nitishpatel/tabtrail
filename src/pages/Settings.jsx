import React from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { exportMyTabs } from "../helper/main";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />

      <div>
        <h1>Settings</h1>
        <div className="settings-item">
          <h1>Export Data</h1>
          <button
            style={{
              width: "100px",
            }}
            onClick={async () => {
              const data = await exportMyTabs();
              // Download the data as a file in JSON format automatically
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob([JSON.stringify(data)], {
                  type: "application/json",
                })
              );
              a.setAttribute("download", "myTabs.json");
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="button-32"
          >
            Export
          </button>
        </div>

        <button className="button-35" onClick={() => navigate("/")}>
          Back
        </button>
      </div>
    </div>
  );
};

export default Settings;
