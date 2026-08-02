---
title: "leetcode102"
description: "原始备忘录《leetcode102》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, DFS, BFS]
---

# leetcode102



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
    vector<vector<int>> levelOrder(TreeNode* root) {
        //这种是BFS吧
        //挂着队列做
        //queue的作用：先把这一列的东西入队，这个left先right后，不能调换
        //这一列整理好入队以后，再让res和level比对，res全填满就行
        queue<TreeNode*> q;
        vector<vector<int>> res;
        if(root==nullptr) return res;
        q.push(root);
        while(!q.empty()) {
          vector<int> level;
          int size=q.size();

          for(int i=0;i<size;i++){
            auto node=q.front();
            q.pop();
            level.push_back(node->val);

            if(node->left) q.push(node->left);
            if(node->right) q.push(node->right);

          }
          res.push_back(level);

        }
        return res;
    }
};

```



这个题这么理解，层序遍历就是一行从左到右遍历

实际上就是BFS，如果是BFS的话，需要用queue来储存

大概思路是这样，就是先存这一行的到队列，存好以后把这个里面顺序好的东西扔到那个vector里面，就好了
