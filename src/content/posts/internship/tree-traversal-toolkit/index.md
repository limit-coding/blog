---
title: 二叉树遍历工具箱：递归、显式栈与层序队列
description: 把前序、中序、后序和层序遍历整理成一套可迁移模板，并扩展到 N 叉树。
section: internship
date: 2026-08-02
tags: [算法, 二叉树, DFS, BFS]
---

树题最先出现的往往是遍历。单独记四段代码并不难，真正重要的是理解“节点在什么时候被处理”，这样换成递归、显式栈或 N 叉树时仍能重新推出来。

## 递归：处理位置决定顺序

```cpp
void dfs(TreeNode* node, vector<int>& out) {
    if (node == nullptr) return;

    // out.push_back(node->val);  // 前序
    dfs(node->left, out);
    // out.push_back(node->val);  // 中序
    dfs(node->right, out);
    // out.push_back(node->val);  // 后序
}
```

前序在进入节点时处理，中序在左右子树之间处理，后序在离开节点时处理。这里的注释位置比名称更值得记忆。

## 中序遍历的显式栈

递归调用栈可以手动展开。中序遍历要先一路压入左链，弹出一个节点后再转向它的右子树：

```cpp
vector<int> inorderTraversal(TreeNode* root) {
    vector<int> out;
    stack<TreeNode*> st;
    TreeNode* cur = root;

    while (cur != nullptr || !st.empty()) {
        while (cur != nullptr) {
            st.push(cur);
            cur = cur->left;
        }
        cur = st.top();
        st.pop();
        out.push_back(cur->val);
        cur = cur->right;
    }
    return out;
}
```

前序也可用栈：弹出节点后先压右、再压左，使左子树先被访问。后序若用单栈，需要记录上次访问节点；面试中也可用“根—右—左再反转”快速得到左—右—根，但要能解释额外反转的代价。

## 层序遍历的队列边界

```cpp
vector<vector<int>> levelOrder(TreeNode* root) {
    if (root == nullptr) return {};
    vector<vector<int>> ans;
    queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        int size = q.size();
        vector<int> level;
        while (size--) {
            TreeNode* node = q.front();
            q.pop();
            level.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        ans.push_back(std::move(level));
    }
    return ans;
}
```

进入内层循环前保存 `q.size()`，就冻结了当前层边界。否则新加入的下一层节点会混进本层。

## 扩展到 N 叉树

递归 DFS 只需把左右孩子改成遍历 `children`；BFS 则把所有非空孩子入队。树的分叉数量变了，遍历框架没有变。

我做树题时会先问：这是沿深度收集信息，还是按距离分层？节点应在进入、左右之间，还是离开时处理？确定这两点，大多数遍历代码就不需要死记。
