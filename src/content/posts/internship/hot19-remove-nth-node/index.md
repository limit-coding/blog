---
title: Hot19 删除链表倒数第 N 个节点
description: 两种解法：先求长度再定位，以及快慢指针一次遍历
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, 快慢指针]
cover: ./cover.jpg
---

## 解法一：先求长度再定位

两步走：先遍历一遍求链表总长，再走 `len-n` 步定位到目标节点的前驱，执行删除。

```cpp
class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode* dummy = new ListNode(0);
        dummy->next = head;
        ListNode* cur = dummy;

        int len = 0;
        while (cur->next != nullptr) {
            len++;
            cur = cur->next;
        }
        cur = dummy;
        for (int i = 0; i < len - n; i++) {
            cur = cur->next;
        }
        cur->next = cur->next->next;
        return dummy->next;
    }
};
```

## 解法二：快慢指针（一次遍历）

让 fast 比 slow 提前走 `n+1` 步，使两者间距保持 n+1。当 fast 到达 nullptr 时，slow 正好停在目标节点的前驱位置。

```cpp
class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode* dummy = new ListNode(0);
        dummy->next = head;
        auto fast = dummy;
        auto slow = dummy;

        for (int i = 0; i < n + 1; i++) {
            fast = fast->next;
        }
        while (fast != nullptr) {
            fast = fast->next;
            slow = slow->next;
        }
        slow->next = slow->next->next;
        return dummy->next;
    }
};
```

为什么是 `n+1` 步而不是 `n` 步：需要让 slow 停在**前驱**节点，而不是目标节点本身，这样才能执行 `slow->next = slow->next->next` 删除操作。
