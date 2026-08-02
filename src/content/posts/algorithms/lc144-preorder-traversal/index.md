---
title: "Leetcode144 前序遍历"
description: "原始备忘录《Leetcode144 前序遍历》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, DFS, BFS]
---

# Leetcode144 前序遍历



```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    void dfs(TreeNode* node,vector<int>& res){
      if(!node) return;
      //顺序 根左右
      res.push_back(node->val);
      dfs(node->left,res);
      dfs(node->right,res);
    }
    vector<int> preorderTraversal(TreeNode* root) {
        vector<int> res;
        dfs(root,res);
        return res;
    }
};

```



同94


```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    vector<int> preorderTraversal(TreeNode* root) {
        stack<TreeNode*> st;
        vector<int> res;
        TreeNode* cur=root;
        //顺序，根左右
        while(cur || !st.empty()){
          while(cur){
            //这个地方先访问
            res.push_back(cur->val);
            st.push(cur);
            cur=cur->left;
          }
          cur=st.top();
          st.pop();
          cur=cur->right;

        }
        return res;

    }
};

```
