---
title: "Leetcode236LCA"
description: "原始备忘录《Leetcode236LCA》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, 递归]
---

# Leetcode236LCA



```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if(root==nullptr || p==root || q==root){
          return root;
        }
        TreeNode* left=lowestCommonAncestor(root->left,p,q);
        TreeNode* right=lowestCommonAncestor(root->right,p,q);
        if(left && right) {
          return root;
        }
        return left?left:right;

    }
};

```



这个要用后序遍历，那个left和right就是正常的遍历到null,然后往回走的时候，优先走left，然后走right，就是后序：左右根，当左右都不是null的时候才返回根，不然就先返回left

其实本质上回溯，如果pq都是一侧，那么就去那一侧，就是return left?left:right
如果不是一侧，那就两侧的话，且

返回值的含义你要先想清楚：这个函数返回什么，不是"随便一个节点"，而是有明确语义的——
* 返回 nullptr：这棵子树里 p 和 q 都不存在。
* 返回某个非空节点 X：说明这棵子树里"已经找到答案的线索"，X 要么是 p 本身，要么是 q 本身，要么就是已经算出来的 LCA（p、q 都在这棵子树里，且已经在更深层被判定出汇合点了）。
明白这个之后，
     left && right
  都非空是什么意思就清楚了：
左子树返回非空，说明 p 或 q（至少一个）藏在左子树里；右子树返回非空，说明 p 或 q（至少一个）藏在右子树里。因为 p 和 q 是两个不同的节点，左右子树又是完全不相交的两块地盘，如果两边都有"命中"，唯一的可能就是：p 在左边，q 在右边（或反过来），不可能出现两个都在左边这种情况（那样右边就该是 null 了）。
也就是说，一旦左右都非空，就证明了"root 是 p 和 q 路径分叉的那个点"——p 走到 root 往左才能碰到，q 走到 root 往右才能碰到，root 正是它们路径分开的最后一个公共节点，这正是 LCA 的定义。所以此时直接
     return root
 ，不用再看 left 和 right 具体是什么值。
反过来，如果只有一边非空（比如 left 非空、right 是 null），说明 p、q 要么都在左子树里（这时 left 已经是算好的 LCA 了），要么只有其中一个在左子树、另一个还没找到（这时 left 就是 p 或 q 本身）。不管哪种情况，root 都不是答案，只是搬运工，把 left 原样往上传（
     return left
 ），交给更上层去判断。

对，函数调用是从 root 开始的，但实际的"处理顺序"（后序遍历）是先一路递归到底，再从底往上处理。
具体过程分两个阶段：
**下潜阶段**（递归调用，还没执行任何判断逻辑）： 从 root 出发，一路调用 lowestCommonAncestor(root->left, ...)，不断往左（或右）下探，每次先压栈，直到碰到 nullptr 或者碰到 p/q 本身才返回。这个阶段只是在"占位"，还没真正比较 left 和 right。
**回溯阶段**（执行 if 判断，真正的逻辑发生在这里）： 递归到底之后开始一层层 return，每一层拿到自己左右子树的返回值后，才执行 if(left && right) 这行判断。这个判断是从最深的节点开始逐层往浅处执行的，最后才轮到 root 执行这个判断。
用前面那棵树举例（p=7, q=4）：
        3
       / \
      5   1
     / \
    6   2
       / \
      7   4
调用顺序（下潜，从 root=3 出发）： 3 → 5 → 6（触底，left=null,right=null，返回 null）→ 回到5，再调用 2 → 7（触底，7==p，返回7）→回到2，再调用 4（触底，4==q，返回4）→ 回到2，此时 left=7,right=4 都非空，**在节点2这一层**判断成立，返回 2 → 回到5，left=null(来自6),right=2，返回2 → 回到3，同理右边1那支返回null → 3层判断 left=2,right=null，返回2。
所以最终答案 2 是在**节点2那一层的回溯阶段**产生的，然后作为"确定结果"沿着调用栈原路传回 root，中间各层不再改变它、只是透传。这就是为什么感觉像"从下往上"，其实是递归返回值在传递，不是真的有一个指针从叶子往根走。
