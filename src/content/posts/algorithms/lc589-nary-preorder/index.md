---
title: "Leetcode589"
description: "原始备忘录《Leetcode589》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, DFS, BFS]
---

# Leetcode589



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
      //前序顺序：根左右
      res.push_back(node->val);
      for(auto new_node:node->children){
        dfs(new_node,res);
      }
    }
    vector<int> preorder(Node* root) {
        vector<int> res;
        dfs(root,res);
        return res;
    }
};

```



这个也差不多，区别就是遍历需要用个for循环才能遍历
