---
title: "leetcode94 中序遍历"
description: "原始备忘录《leetcode94 中序遍历》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, DFS, BFS]
---

# leetcode94 中序遍历



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
      //按照左根右
      dfs(node->left,res);
      res.push_back(node->val);
      dfs(node->right,res);
    }
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> res;
        dfs(root,res);
        return res;
    }
};

```



用dfs按照顺序遍历，类似的思路应该可以用在另外两种

二叉树遍历三兄弟：
* **LC144** - 二叉树的前序遍历（根左右）
* **LC145** - 二叉树的后序遍历（左右根，三个里最容易在迭代版本卡壳的一个）
* **LC94** - 你刚做的中序遍历（左根右）
如果想多练传值/传引用这个坑，N 叉树版本也可以顺手做一下：
* **LC589** - N 叉树的前序遍历
* **LC590** - N 叉树的后序遍历
三个二叉树遍历建议递归和迭代版本都手写一遍，尤其是后序迭代版（LC145），需要一个技巧（反转前序遍历结果，或者用双栈/标记法），比前序和中序难写不少，[某公司]手撕环节比较爱考。

栈做法


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
    vector<int> inorderTraversal(TreeNode* root) {
        //用栈
        vector<int> res;
        stack<TreeNode*> st;
        TreeNode* cur=root;
        while(cur || !st.empty()){
          while(cur){
            st.push(cur);
            cur=cur->left;
          }
          //左边遍历完就开始弄中间和右边
          cur=st.top();
          st.pop();
          res.push_back(cur->val);
          cur=cur->right;
        }
        return res;
    }
};


```
