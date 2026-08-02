---
title: "Leetcode590"
description: "原始备忘录《Leetcode590》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, DFS, BFS]
---

# Leetcode590



```
/*
// Definition for a Node.
class Node {
public:
    int val;
    vector<Node*> children;

    Node() {}

    Node(int _val) {
        val = _val;
    }

    Node(int _val, vector<Node*> _children) {
        val = _val;
        children = _children;
    }
};
*/

class Solution {
public:
    void dfs(Node* node,vector<int>& res){
      if(!node) return;
      //顺序：左右根
      for(auto new_node:node->children){
        dfs(new_node,res);
      }
      res.push_back(node->val);
    }
    vector<int> postorder(Node* root) {
        vector<int> res;
        dfs(root,res);
        return res;
    }
};

```



同589
