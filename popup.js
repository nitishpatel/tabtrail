const tabUrls = [
  "https://www.google.com/",
  "https://www.youtube.com/",
  "https://www.facebook.com/",
];

function setErrorMessage(message) {
  const alert = `
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <p id="errorText">${message}</p>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;

  const errorContainer = document.getElementById("error");
  if (errorContainer) {
    errorContainer.innerHTML = alert;
  }
  // Close the alert after 3 seconds
  setTimeout(() => {
    const alert = document.querySelector(".alert");
    if (alert) {
      alert.remove();
    }
  }, 3000);
}

// Promisify chrome.tabs.create
const createTab = (url) => {
  return new Promise((resolve) => {
    chrome.tabs.create({ url, active: false }, (newTab) => {
      resolve(newTab.id);
    });
  });
};

// Promisify chrome.tabs.group
const groupTabs = (tabIds) => {
  return new Promise((resolve) => {
    chrome.tabs.group({ tabIds }, (groupId) => {
      resolve(groupId);
    });
  });
};

function displayGroupInfo() {
  chrome.storage.local.get(["groupInfo"], function (result) {
    if (chrome.runtime.lastError) {
      console.error(
        "Error retrieving group info from local storage:",
        chrome.runtime.lastError
      );
    } else {
      const groupInfo = result.groupInfo || "[]";
      const groupInfoObj = JSON.parse(groupInfo);

      // create li elements for each groupInfoObj
      const listItems = groupInfoObj.map((group) => {
        const tabsTab = group.tabs.map((tab) => {
          return `<tr>
                    <td class='ellipsis'>${tab}</td>
                  </tr>`;
        });

        return `<li class="card" style="border-color: ${group.color}" id="${
          group.groupId
        }" onclick="createTabGroup(${group.groupId})" nonce="${group.groupId}">
                  <h6 style="color: ${group.color}">${group.title}</h6>
                  <table>
                    <tr>
                      <th>TABS</th>
                    </tr>
                    ${tabsTab.join("")}
                  </table>
                </li>`;
      });

      // append the listItems to the ul element
      document.getElementById("tabs").innerHTML = listItems.join("");
    }
  });
}

// Promisify chrome.tabGroups.update
const updateGroup = (groupId) => {
  return new Promise((resolve, reject) => {
    chrome.tabGroups.update(
      groupId,
      {
        title: "My Group",
        color: "red",
        collapsed: false,
      },
      (updatedGroup) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(updatedGroup);
        }
      }
    );
  });
};

async function createTabGroup(groupId) {
  // Fetching the tab group based on the groupId from the storage
  const groups = await chrome.storage.local.get(["groupInfo"]);
  const groupInfo = groups.groupInfo.filter(
    (group) => group.groupId === groupId
  );
  if (!groupInfo) {
    console.error("Group not found.");
    setErrorMessage("Group not found.");
  }

  const tabIds = [];

  // Iterate over tabUrls and create tabs
  for (const url of tabUrls) {
    const tabId = await createTab(url);
    tabIds.push(tabId);
  }

  // Group created tabs
  const newGroupId = await groupTabs(tabIds);

  // Update the group
  try {
    const updatedGroup = await updateGroup(newGroupId);
    alert("Group updated successfully with id: " + updatedGroup.id);
  } catch (error) {
    setErrorMessage(error.message);
  }
}

// Create a function to get the current tab and save the group info to local storage
function saveGroupInfoToLocalStorage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs && tabs.length > 0) {
      const currentTab = tabs[0];

      chrome.tabs.get(currentTab.id, async function (tab) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error retrieving tab information:",
            chrome.runtime.lastError
          );
          setErrorMessage(chrome.runtime.lastError.message);
        } else {
          if (tab.groupId === -1) {
            console.error("Tab is not in a group.");
            setErrorMessage("Tab is not in a group.");
            return;
          }
          const group = await chrome.tabGroups.get(tab.groupId);

          if (group) {
            const groupInfo = {
              groupId: tab.groupId,
              title: group.title,
              color: group.color,
              collapsed: group.collapsed,
            };
            // Get all the tabs in the group
            const tabsInGroup = await chrome.tabs.query({
              groupId: tab.groupId,
            });

            const tabUrls = tabsInGroup.map((tab) => tab.url);
            groupInfo.tabs = tabUrls;

            chrome.storage.local.get(["groupInfo"], function (result) {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error retrieving group info from local storage:",
                  chrome.runtime.lastError
                );
                setErrorMessage(chrome.runtime.lastError.message);
              } else {
                const existingGroupInfo = result.groupInfo || [];
                // check if existingGroupInfo is an array
                const existingGroupInfoObj = Array.isArray(existingGroupInfo)
                  ? existingGroupInfo
                  : JSON.parse(existingGroupInfo);
                existingGroupInfoObj.push(groupInfo);

                chrome.storage.local.set(
                  { groupInfo: JSON.stringify(existingGroupInfoObj) },
                  function () {
                    if (chrome.runtime.lastError) {
                      console.error(
                        "Error saving group info to local storage:",
                        chrome.runtime.lastError
                      );
                    } else {
                      console.log(
                        "Group info saved to local storage:",
                        existingGroupInfoObj
                      );
                      displayGroupInfo();
                    }
                  }
                );
              }
            });
          } else {
            console.error("Tab is not in a group.");
            setErrorMessage("Tab is not in a group.");
          }
        }
      });
    } else {
      console.error("No active tabs found.");
      setErrorMessage("No active tabs found.");
    }
  });
}

document.getElementById("saveTabs").addEventListener("click", function () {
  saveGroupInfoToLocalStorage();
});

displayGroupInfo();
