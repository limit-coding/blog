---
title: Hot49 字母异位词分组：哈希表 + 排序做 key
description: 把字符串排序后当哈希表的 key，把同构的字符串归到同一个桶，理解结构化绑定和引用的区别
section: internship
date: 2026-06-29
tags: [LeetCode, 哈希表, C++]
---

## 题意

给一组字符串，把互为字母异位词（由相同字母组成，顺序不同）的字符串归成一组，返回分组结果。

比如 `["eat","tea","tan","ate","nat","bat"]` → `[["bat"],["nat","tan"],["ate","eat","tea"]]`

## 思路

**分组问题，先想哈希表**。关键是找到一个 key，让同一组的字符串映射到同一个 key。

`eat`、`tea`、`ate` 排序后都是 `aet`——所以把排序后的字符串当 key，原始字符串放进对应的 value vector。

## 实现

```cpp
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> mp;
        for (string s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            mp[key].push_back(s);
        }
        vector<vector<string>> result;
        for (auto& [key, vec] : mp) {
            result.push_back(vec);
        }
        return result;
    }
};
```

## 两个细节

**结构化绑定** `auto& [key, vec]`：C++17 语法，遍历 map 时直接拆出 key 和 value，比 `it->first / it->second` 更清楚。

**加 `&` 的意义**：`auto& [key, vec]` 是引用，不会复制 vector。如果写 `auto [key, vec]`，每次遍历都会把整个 vector 拷贝一份，浪费内存。

**`push_back(vec)` vs `push_back(mp[key])`**：两者等价，都是把对应的字符串列表追加到结果里。
