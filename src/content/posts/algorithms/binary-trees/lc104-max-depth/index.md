---
title: "Leetcode 104"
description: "原始备忘录《Leetcode 104》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, 递归]
---

# Leetcode 104



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
    int maxDepth(TreeNode* root) {

      //还是走的遍历，递归
      if(root==nullptr){
        return 0;
      }
      int leftDepth=maxDepth(root->left);
      int rightDepth=maxDepth(root->right);


      return max(leftDepth,rightDepth)+1;
    }
};

```



这个就是二叉树的遍历，找高度

需要用递归，从左走的全走到头；从右走的走到头，注意，到了nullptr的时候，会回复0，然后但是单只有单节点的时候，这个实际上深度是1，


```
return max(leftDepth,rightDepth)+1;

```
