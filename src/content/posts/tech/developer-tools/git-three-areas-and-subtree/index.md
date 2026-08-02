---
title: 从三个区域理解 Git：以及怎样把嵌套仓库并入主项目
description: 用工作区、暂存区和版本库解释 Git 的状态变化，并记录一次保留历史地合并子仓库的方法。
section: tech
date: 2026-08-02
tags: [Git, 工程实践, 版本控制]
---

# git


Git能实现把三个有独立提交的仓库合并成一个仓库

流程：
先删除过去的

     然后
 clone



     然后
 subtree




```
git add -A
git commit -m "Remove"
git remote remove starter

```




```
mv subproject ../subproject-src
git remote add subproject-src ../subproject-src
cd ~/main-project
git add -A
git commit -m "Remove subproject gitlink, will re-add via subtree"
git fetch subproject-src
git subtree add --prefix=subproject subproject-src main

```





     新建了
 GitHub仓库直接push


```
cd ~/main-project
git remote add origin https://github.com/[用户]/[仓库].git
git push -u origin main

```


## 详细说删除

好的，把整个"删除→提交"流程按 Git 的三个区（工作区 / 暂存区 / 仓库）拆开讲清楚。

Git 的三个区

工作区(Working Directory)  →  暂存区(Index/Staging)  →  仓库(Repository/.git)
       磁盘上的文件              git add 之后的快照          git commit 之后的历史


     **第**
  **0 步之前的状态**

subproject 三个区里都一致：都存在，且在仓库里是一个 gitlink（因为它带着自己的 .git）。


```
工作区: subproject/ (真实文件夹，含嵌套 .git)
暂存区: subproject  (gitlink 记录)
仓库:   subproject  (gitlink 记录，在 HEAD 指向的 commit 里)

```


第 1 步：mv subproject ../subproject-src

这纯粹是文件系统操作，Git 完全不知情。结果是：

工作区: subproject 不存在了（挪走了）
暂存区: subproject  ← 还在（没变）
仓库:   subproject  ← 还在（没变）

工作区 ≠ 暂存区，出现了差异。

第 2 步：git status

Git 对比三个区，发现"暂存区有、工作区没有" → 判定为一处未暂存的删除，显示：

Changes not staged for commit:
    deleted: subproject

（就是你之前看到的 D subproject）

第 3 步：git add -A

把工作区的当前状态（"这里已经没有这个东西了"）同步进暂存区：

工作区: subproject 不存在
暂存区: subproject 也被移除了   ← 变化发生在这里
仓库:   subproject  ← 还在（没变，等着被 commit 更新）

现在暂存区和仓库不一致了，git status 会显示：

Changes to be committed:
    deleted: subproject

这一步只是"记录意图"，还没写进历史。

第 4 步：git commit

Git 拿暂存区当前的完整快照，打包成一个新的 commit 对象，让 HEAD 指向它：

仓库历史: ... → [旧commit: 含 subproject] → [新commit: 不含 subproject] ← HEAD

三个区现在重新一致（都不含它）。

关键点：旧 commit 毫发无损

git log 依然能看到之前那个 commit，用

git show <旧commit哈希>:subproject

依然能取出当时的记录。"删除"只是新快照里不包含它，不是把历史抹除——这也是为什么 Git 里几乎没有真正意义的"删除历史"，只有"新增一个不包含它的快照"。

之后为什么 subtree add 能跑了

git subtree add 要求三个区完全一致（working tree clean）。经过 add -A + commit，三个区都不再含 subproject 这个旧的 gitlink 了，所以命令能顺利往这个路径下重新创建一份真正带文件历史的子目录。


### 详解三条命令
1. mv subproject ../subproject-src

纯文件系统操作，把整个文件夹（包括它自带的 .git，也就是完整的 11 个 commit 历史）从

~/main-project/subproject

挪到

~/subproject-src        （.. 就是 main-project 的上一级，也就是 ~/）

关键：这个文件夹自己的 git 仓库完好无损，只是换了个磁盘位置。之所以要挪走，是因为 subproject 这个路径接下来要让 subtree add 重新创建——而 subtree 要求目标路径当前必须是空的/不存在，不能有旧东西占着。

---
2. git fetch subproject-src

这里 subproject-src 不是网址，是你之前用

git remote add subproject-src ../subproject-src

注册的一个 remote 名字，它指向的地址就是本地路径 ../subproject-src（也就是刚才挪过去的那个仓库）。

Git 支持本地路径当 remote，原理和 GitHub 一样，只是"服务器"就是你磁盘上的另一个 .git。git fetch subproject-src 做的事：

1. 连接到 ../subproject-src 这个仓库
2. 把它里面 main-project 当前没有的 commit / tree / blob 对象，全部拷贝进 main-project/.git/objects
3. 在本地建一个远程跟踪分支 subproject-src/main，指向那边 main 的最新 commit

你看到的输出：
* [new branch]      main       -> subproject-src/main
就是在说"我在本地新建了一个跟踪引用 subproject-src/main，指向刚拉下来的历史"。

注意：这一步只是把数据搬进你的仓库、建个引用，并没有改动你的工作区或 main 分支，纯粹是准备数据。

---
3. git subtree add --prefix=subproject subproject-src main

这是最关键的一步，git subtree（contrib 工具，本质是一系列 git 命令的封装脚本）在背后做的事情：

(1) 重写路径：拿到 subproject-src/main 的整条历史（11 个 commit），对每一个 commit 生成一个新的"影子 commit"——内容一模一样，只是把所有文件从仓库根目录挪到 subproject/ 前缀下。比如原来 README.md，影子历史里变成 subproject/README.md。

(2) 执行一次真正的 merge：把这条重写后的历史，合并进你当前的 main 分支，生成一个 merge commit，这个 commit 有两个父节点：

        ┌── 你当前的 main (main-project 自己的历史)
merge ──┤
        └── 重写后的 subproject-src 历史（路径已经在 subproject/ 下）

(3) 落地到工作区：merge 完成后，subproject/ 这个文件夹连同所有文件重新出现在你的工作目录里——但这次不再是 gitlink（一个指针），而是真正被主仓库追踪的普通文件，同时保留了完整的历史轨迹。

之后你可以验证：

git log subproject/          # 能看到原来那 11 条 commit
git log --graph --oneline -15        # 能看到刚才那次 merge 的分叉结构

---
为什么要分成"先 fetch 再 subtree add"两步，而不是一步到位？

git subtree add 其实也能直接接受一个仓库 URL/远程名 + 分支自动帮你 fetch，但分开写的好处是：如果 fetch 阶段网络或路径出错，报错信息更清楚，你能先确认 subproject-src/main 确实拉下来了，再执行有一定"重量"的 subtree 操作，出问题时更容易定位是哪一步的锅。
