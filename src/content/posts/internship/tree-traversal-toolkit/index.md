---
title: 二叉树遍历工具箱：递归、显式栈与层序队列
description: 把前序、中序、后序和层序遍历整理成一套可迁移模板，并扩展到 N 叉树。
section: internship
date: 2026-08-02
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

---

# Leetcode145 后序遍历



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
      //顺序:左右根
      dfs(node->left,res);
      dfs(node->right,res);
      res.push_back(node->val);
    }
    vector<int> postorderTraversal(TreeNode* root) {
        vector<int> res;
        dfs(root,res);
        return res;
    }
};

```



同理94

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
