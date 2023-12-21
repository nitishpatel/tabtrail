document.getElementById("openTabs").addEventListener("click", function () {
  createTabGroup();
});

const tabUrls = [
  "https://www.google.com/",
  "https://www.youtube.com/",
  "https://www.facebook.com/",
];

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

async function createTabGroup() {
  const tabIds = [];

  // Iterate over tabUrls and create tabs
  for (const url of tabUrls) {
    const tabId = await createTab(url);
    tabIds.push(tabId);
  }

  // Group created tabs
  const groupId = await groupTabs(tabIds);

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

      // create li elements for each groupInfoObj
      const listItems = groupInfoObj.map((group) => {
        return `<li style="background-color: ${group.color};">
                  <h3>${group.title}</h3>
                  <p>Color: ${group.color}</p>
                  <p>Collapsed: ${group.collapsed}</p>
                </li>`;
      });

      // append the listItems to the ul element
      document.getElementById("tabs").innerHTML = listItems.join("");
    }
  });
}

document.getElementById("clearTabs").addEventListener("click", function () {
  chrome.storage.local.clear(function () {
    if (chrome.runtime.lastError) {
      console.error("Error clearing local storage:", chrome.runtime.lastError);
    } else {
      console.log("Local storage cleared successfully.");
    }
  });
});

displayGroupInfo();
