---
title: Hot206 反转链表：三指针迭代法
description: 单链表只能往前走，反转的关键是每次操作前先把 next 保存下来，再改指向，再推进指针
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, C++]
---

## 链表结构回顾

单链表的每个节点有两个部分：`val`（值）和 `next`（指向下一个节点的指针）。它只能往前走，没有回头路。

## 反转思路

目标：把 `1→2→3→4→5` 变成 `5→4→3→2→1→null`。

每次操作：让当前节点的 `next` 指向前一个节点。需要三个指针：

- `prev`：前一个节点（初始为 `nullptr`）
- `cur`：当前节点
- `temp`：临时保存 `cur->next`，防止改指向后丢失后续节点

每轮循环做三件事：
1. `temp = cur->next`（保存后继）
2. `cur->next = prev`（改指向，完成这一步的反转）
3. `prev = cur; cur = temp`（推进两个指针）

```cpp
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* cur = head;
        while (cur != nullptr) {
            auto temp = cur->next;
            cur->next = prev;
            prev = cur;
            cur = temp;
        }
        return prev;
    }
};
```

循环结束时 `cur == nullptr`，`prev` 指向原来的最后一个节点，也就是新链表的头，返回 `prev`。

## 链表插入与删除（附）

**插入**（在节点 x 之后插入 node）：

```cpp
// 顺序很关键：先接上后半，再断开前半
node->next = x->next;
x->next = node;
```

或者用 temp 保存：

```cpp
auto temp = x->next;
x->next = node;
node->next = temp;
```

**删除**（删除 node 的后继节点）：

```cpp
if (node->next == nullptr) return;
node->next = node->next->next;
```

这些操作的共同点：修改指针前，先把要"断开"的连接保存到临时变量，否则链表会断链。
