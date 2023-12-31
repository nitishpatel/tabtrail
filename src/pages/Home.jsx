import { useEffect, useState } from "preact/hooks";
import open from "../assets/share.png";
import "../app.css";
import { createTabGroup, saveTabs, getTabs,deleteGroup } from "../helper/main";
import { ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";

export function Home() {
  const [count, setCount] = useState(0);
  const [tabGroups, setTabGroups] = useState([]);
  const [reRender, setReRender] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tabs = await getTabs();
        console.log(tabs); // Do something with the tabs
        setTabGroups(tabs);
      } catch (error) {
        console.error(error.message); // Handle the error
      }
    };
    fetchData();
  }, [reRender]);

  return (
    <>
      <Navbar/>
      <div className="card">
        {/* <button onClick={createTabGroup}>Open Tabs</button> */}
        <button
          className="button-35"
          onClick={async () => {
            await saveTabs();
            setReRender(!reRender);
          }}
        >
          Save Tab Group
        </button>
      </div>
      <div>
        <h2>Tab Groups</h2>
        {tabGroups &&
          tabGroups.map((tabGroup) => {
            return (
              <div
                className="item"
                style={{
                  border: `1px solid ${tabGroup.color}`,
                }}
              >
                <h3 className="item-title">{tabGroup.title}</h3>
                <p>{tabGroup.tabs.length} tabs</p>
                <button onClick={async()=>{
                  await deleteGroup(tabGroup.groupId);
                  setReRender(!reRender);
                }}>Remove</button>
                <button
                  onClick={() => {
                    createTabGroup(tabGroup.groupId);
                  }}
                >
                  <img
                    src={open}
                    alt="open"
                    style={{
                      width: "20px",
                      height: "20px",
                    }}
                  />
                  <a
                    style={{
                      display: "none",
                    }}
                    href="https://www.flaticon.com/free-icons/share"
                    title="share icons"
                  >
                    Share icons created by IconKanan - Flaticon
                  </a>
                </button>
              </div>
            );
          })}
      </div>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
