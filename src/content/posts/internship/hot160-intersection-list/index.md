---
title: Hot160 相交链表：双指针走 m+n 步必然相遇
description: 两个指针各自走完自己那条链再走对方那条，总步数相同，如果有交点一定在同一步相遇
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, 双指针, C++]
---

## 题意

给两个链表 headA 和 headB，找出它们相交的起始节点。不相交返回 null。

## 我的初始困惑

两个链表长度不同，没法同时步进——不知道怎么对齐。

## 双指针解法

两个指针 `cur1`、`cur2` 分别从 headA、headB 出发，步进规则：

- 走到末尾（`nullptr`）时，跳到对方链表的头节点继续走
- 否则正常走 `next`

```cpp
class Solution {
public:
    ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
        auto cur1 = headA, cur2 = headB;
        while (cur1 != cur2) {
            cur1 = cur1 != nullptr ? cur1->next : headB;
            cur2 = cur2 != nullptr ? cur2->next : headA;
        }
        return cur1;
    }
};
```

## 为什么必然相遇

设 A 非重叠部分长 a，B 非重叠部分长 b，公共部分长 c。

- `cur1` 走的路径：a + c + b（走完 A，跳到 B 头，走到交点）
- `cur2` 走的路径：b + c + a

两者总步数都是 `a + b + c`，在第 `a + b + c` 步时同时到达交点，于是 `cur1 == cur2`，退出循环。

**如果不相交（c = 0）**：`cur1` 走 a + b 步，`cur2` 走 b + a 步，两者同时走到 `nullptr`，`cur1 == cur2 == nullptr`，返回 null，也是正确的。

## 三元运算符

```cpp
cur1 = cur1 != nullptr ? cur1->next : headB;
```

等价于：

```cpp
if (cur1 != nullptr) cur1 = cur1->next;
else cur1 = headB;
```

三元运算符在这种场景下更简洁，一眼看出逻辑是"没到头就走，到头了就跳"。
