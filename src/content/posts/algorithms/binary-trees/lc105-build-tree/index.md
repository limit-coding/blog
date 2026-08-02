---
title: "Leetcode105"
description: "原始备忘录《Leetcode105》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, 递归]
---

# Leetcode105




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


    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        unordered_map<int,int> idxMap;
        for(int i=0;i<inorder.size();i++){
          idxMap[inorder[i]]=i;
        }
        int pre_idx=0;
        return build(preorder,idxMap,pre_idx,0,(int)inorder.size()-1);
    }
    TreeNode* build(vector<int>& preorder,unordered_map<int,int>& idxMap,int& pre_idx,int inLeft,int inRight){
      if(inLeft>inRight) return nullptr;

      int root_val=preorder[pre_idx++];
      auto root=new TreeNode(root_val);
      int mid=idxMap[root_val];
      root->left=build(preorder,idxMap,pre_idx,inLeft,mid-1);
      root->right=build(preorder,idxMap,pre_idx,mid+1,inRight);

      return root;
    }
};

```




S
