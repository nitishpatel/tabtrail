document.getElementById("openTabs").addEventListener("click", function () {
  createTabGroup();
});

const tabUrls = [
  "https://www.google.com/",
  "https://www.youtube.com/",
  "https://www.facebook.com/",
];

async function createTabGroup() {
  const tabIds = [];

  // Promisify chrome.tabs.create
  const createTab = (url) => {
    return new Promise((resolve) => {
      chrome.tabs.create({ url, active: false }, (newTab) => {
        tabIds.push(newTab.id);
        resolve();
      });
    });
  };

  // Promisify chrome.tabs.group
  const groupTabs = () => {
    return new Promise((resolve) => {
      chrome.tabs.group({ tabIds }, (groupId) => {
        resolve(groupId);
      });
    });
  };

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

  // Iterate over tabUrls and create tabs
  for (const url of tabUrls) {
    await createTab(url);
  }

  // Group created tabs
  const groupId = await groupTabs();

  // Update the group
  try {
    const updatedGroup = await updateGroup(groupId);
    alert("Group updated successfully with id: " + updatedGroup.id);
  } catch (error) {
    alert("Failed to update the group: " + error.message);
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
        } else {
          const group = await chrome.tabGroups.get(tab.groupId);

          if (group) {
            const groupInfo = {
              groupId: tab.groupId,
              title: group.title,
              color: group.color,
              collapsed: group.collapsed,
            };

            chrome.storage.local.get(["groupInfo"], function (result) {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error retrieving group info from local storage:",
                  chrome.runtime.lastError
                );
              } else {
                const existingGroupInfo = result.groupInfo || [];
                const existingGroupInfoObj = JSON.parse(existingGroupInfo);
                alert(JSON.stringify(existingGroupInfoObj));
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
                    }
                  }
                );
              }
            });
          } else {
            console.error("Tab is not in a group.");
          }
        }
      });
    } else {
      console.error("No active tabs found.");
    }
  });
}

document.getElementById("saveTabs").addEventListener("click", function () {
  saveGroupInfoToLocalStorage();
});

// Fetch the group info from local storage and display it in the popup id=tabs
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

      if (groupInfoObj.length > 0) {
        const lastGroupInfo = groupInfoObj[groupInfoObj.length - 1];
        document.getElementById(
          "tabs"
        ).innerHTML = `${lastGroupInfo.title} - ${lastGroupInfo.color} - ${lastGroupInfo.collapsed}`;
      } else {
        console.log("No group information found in local storage.");
      }
    }
  });
}

displayGroupInfo();
