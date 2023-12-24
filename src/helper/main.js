// const tabUrls = [
//   "https://www.google.com",
//   "https://www.facebook.com",
//   "https://www.twitter.com",
// ];

// Promisify chrome.tabs.create
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
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
    // Check if
    chrome.tabs.group({ tabIds }, (groupId) => {
      resolve(groupId);
    });
  });
};

// Promisify chrome.tabGroups.update
const updateGroup = (groupId, groupName, groupColor) => {
  return new Promise((resolve, reject) => {
    chrome.tabGroups.update(
      groupId,
      {
        title: groupName,
        color: groupColor,
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

export const createTabGroup = async (groupId) => {
  let groups = await chrome.storage.local.get(["groupInfo"]);
  groups = JSON.parse(groups.groupInfo);
  const groupInfo = groups.filter((group) => group.groupId === groupId);

  if (groupInfo.length === 0) {
    console.error("No group found with id: " + groupId);
    toast.error("No group found with id: " + groupId);
  }

  const tabUrls = groupInfo[0].tabs;

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
    const updatedGroup = await updateGroup(
      newGroupId,
      groupInfo[0].title,
      groupInfo[0].color
    );
    toast.success("Group created successfully");
  } catch (error) {
    toast.error("Error updating group");
  }
};

export const saveTabs = async () => {
  try {
    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs);
      });
    });

    if (tabs && tabs.length > 0) {
      const currentTab = tabs[0];

      const tab = await new Promise((resolve) => {
        chrome.tabs.get(currentTab.id, (tab) => {
          resolve(tab);
        });
      });

      if (!chrome.runtime.lastError && tab.groupId !== -1) {
        const group = await new Promise((resolve) => {
          chrome.tabGroups.get(tab.groupId, (group) => {
            resolve(group);
          });
        });

        const groupInfo = {
          groupId: uuidv4(),
          title: group.title,
          color: group.color,
          collapsed: group.collapsed,
        };

        const tabsInGroup = await new Promise((resolve) => {
          chrome.tabs.query({ groupId: tab.groupId }, (tabsInGroup) => {
            resolve(tabsInGroup);
          });
        });

        const tabUrls = tabsInGroup.map((tab) => tab.url);
        groupInfo.tabs = tabUrls;

        const existingGroupInfo = await new Promise((resolve) => {
          chrome.storage.local.get(["groupInfo"], (result) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error retrieving group info from local storage:",
                chrome.runtime.lastError
              );
              toast.error("Error retrieving group info from local storage");
              resolve([]);
            } else {
              resolve(result.groupInfo || []);
            }
          });
        });

        let existingGroupInfoObj = Array.isArray(existingGroupInfo)
          ? existingGroupInfo
          : JSON.parse(existingGroupInfo);

        // Check if group already exists in local storage
        let existingGroup = existingGroupInfoObj.filter(
          (group) => group.title === groupInfo.title
        );

        if (existingGroup.length > 0 && existingGroup[0].tabs.length > 0) {
          // merge the tabs
          groupInfo.tabs = [...existingGroup[0].tabs, ...groupInfo.tabs];
          // remove duplicates
          groupInfo.tabs = [...new Set(groupInfo.tabs)];

          // remove the existing group
          existingGroupInfoObj = existingGroupInfoObj.filter(
            (group) => group.title !== groupInfo.title
          );
        }

        existingGroupInfoObj.push(groupInfo);

        await new Promise((resolve) => {
          chrome.storage.local.set(
            { groupInfo: JSON.stringify(existingGroupInfoObj) },
            () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error saving group info to local storage:",
                  chrome.runtime.lastError
                );
                toast.error("Error saving group info to local storage");
              } else {
                console.log(
                  "Group info saved to local storage:",
                  existingGroupInfoObj
                );
                toast.success("Group info saved to local storage");
                resolve();
              }
            }
          );
        });
      } else {
        toast.error("No tab group found");
      }
    }
  } catch (error) {
    console.error("Error in saveTabs:", error);
    toast.error("Error in saveTabs");
  }
};

export const getTabs = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["groupInfo"], function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!result.groupInfo) {
        // toast.error("No tabs saved yet.");
        resolve([]);
        return;
      }

      const groupInfo = JSON.parse(result.groupInfo);
      resolve(groupInfo);
    });
  });
};

export const deleteGroup = async (groupId) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["groupInfo"], function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!result.groupInfo) {
        toast.error("No tabs saved yet.");
        resolve([]);
        return;
      }

      const groupInfo = JSON.parse(result.groupInfo);
      const updatedGroupInfo = groupInfo.filter(
        (group) => group.groupId !== groupId
      );

      chrome.storage.local.set(
        { groupInfo: JSON.stringify(updatedGroupInfo) },
        function () {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        }
      );
    });
  });
};

export const exportMyTabs = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["groupInfo"], function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!result.groupInfo) {
        toast.error("No tabs saved yet.");
        resolve([]);
        return;
      }

      const groupInfo = JSON.parse(result.groupInfo);
      resolve(groupInfo);
    });
  });
};
