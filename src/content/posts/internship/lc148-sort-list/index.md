---
title: LeetCode148 归并排序链表
description: 快慢指针找中点 + 递归分治，mergesort 拿到的两个子链表一定是有序的
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, 排序, 递归]
---

## 思路

用归并排序：快慢指针找到链表中点，递归排左半和右半，最后合并。

这题是 Hot21（合并有序链表）的扩展，后半部分直接复用合并逻辑。

## 代码

```cpp
class Solution {
public:
    ListNode* sortList(ListNode* head) {
        if (head == nullptr || head->next == nullptr) return head;

        ListNode* fast = head->next;
        ListNode* slow = head;
        while (fast != nullptr && fast->next != nullptr) {
            fast = fast->next->next;
            slow = slow->next;
        }
        ListNode* mid = slow->next;
        slow->next = nullptr;  // 切断两半

        auto left = sortList(head);
        auto right = sortList(mid);
        return merge(left, right);
    }

    ListNode* merge(ListNode* l1, ListNode* l2) {
        ListNode* dummy = new ListNode(0);
        ListNode* cur = dummy;
        while (l1 != nullptr && l2 != nullptr) {
            if (l1->val > l2->val) {
                cur->next = l2;
                l2 = l2->next;
            } else {
                cur->next = l1;
                l1 = l1->next;
            }
            cur = cur->next;
        }
        if (l1 != nullptr) cur->next = l1;
        else cur->next = l2;
        return dummy->next;
    }
};
```

## 关键理解：merge 拿到的两个链表一定有序吗？

以 `4->2->1->3` 为例：

```
sortList(4->2->1->3)
├── 切成 [4->2] 和 [1->3]
├── sortList(4->2)
│   ├── 切成 [4] 和 [2]
│   ├── sortList(4) → 返回 4   ← 单节点，触发终止条件
│   ├── sortList(2) → 返回 2
│   └── merge(4, 2) → 返回 2->4
├── sortList(1->3)
│   └── merge(1, 3) → 返回 1->3
└── merge(2->4, 1->3) → 返回 1->2->3->4
```

**merge 不是第一步，是最后一步。** 递归从单节点（天然有序）开始向上合并，到当前层时两边已经排好了，merge 拿到的必然是有序链表。
