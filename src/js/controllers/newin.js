'use strict';

angular.module('copayApp.controllers').controller('newsinController', function($scope, $rootScope, $timeout, go, $state, $stateParams, $sce) {

    var self = this;
    self.id = $stateParams.id;
    self.newstitle = '';
    self.newscontent = '';
    console.log(self.id)
    let news = require("intervaluecore/newsServers");
    self.newsInfoData = function () {
        self.newstitle = 1111111111;
        var htmlmmm = '<p><img src="https://ch-linker.oss-cn-shenzhen.aliyuncs.com/20181018/f451effece574099a2337a851e2399c2.png" alt="微信图片_20181018173840.png" /></p> <p>回顾历史，每一次新老交替，社会变革之际，都是机遇与挑战并存，黑暗中隐现曙光。</p> <p>区块链生态建设对于公链来说无疑是一条必经之路。生态应用的推进，使得公链在实用化过程中能够发现自身所存在的各种不足，从而不断改进，促进公链技术的发展。其次，公链本身与区块链生态布局之间的关系也是相辅相成的存在，区块链生态建设依靠于公链技术的强大，而完善的生态体系也是一个公链项目的终极目标。</p> <p>目前来看，整个区块链行业处于一个瓶颈期，也可以说是一个尴尬期。公链项目百花齐放，但真正能够支撑大规模生态应用的公链却并没出现。绝大多数公链本身能够提供的性能弱，不足以支撑大规模的现象级应用落地。很多公链能够提供的应用离实际生活较远，还是一个比较虚的东西。区块链生态体系建设是一个繁杂的系统工程，很多公链刚开始做生态布局，慢慢又回归到公链技术研发本身。这也证明了，这样的公链是无法支撑强大应用的。</p> <p><img src="https://ch-linker.oss-cn-shenzhen.aliyuncs.com/20181018/21af8c0ed3214638a9d7ead7ea205e79.jpg" alt="1.jpg" /></p> <p>而今天我们邀请到了InterValue的创始人兼CEO——Barton Chao为大家介绍InterValue的区块链生态布局，以及他是如何打造共享共赢的可持续发展的绿色生态体系的。</p> <p>InterValue与市面上其他公链相比最大的优势就是InterValue的公链本身有着极其强大的性能，足够支撑强大的应用在区块链上运行发展。那么近期InterValue也进入了生态布局建设阶段，现已涉猎多个行业，与多家企业签订了战略合作协议，其中除却科技公司外，不乏贴近大众生活所需的衣食住行等领域：</p> <p>2018年9月28日，InterValue与北京首家区块链餐厅——“湘见徽味”达成长期战略合作协议。双方将在区块链技术落地应用于餐饮领域方向展开深入合作。</p> <p>2018年9月29日，InterValue与“2017年最受欢迎客栈民宿”云山美地·云歌店正式签订长期战略合作协议，双方将共同开展区块链场景落地探索。</p> <p>2018年10月2日，InterValue与全网最高性价比专业IPFS矿机HashStor正式签订长期战略合作协议。InterValue将为HashStor全面提供区块链分布式存储底层技术支持。</p> <p>2018年10月4日，InterValue与全球首个区块链健身生态项目BodyOne达成长期战略合作，将共同打造区块链健身新生态体系。</p> <p>2018年10月10日，InterValue与湖南方物网络科技——“顽艺儿”达成长期战略合作协议。双方将在区块链技术落地应用于艺术品交易领域展开深入合作。</p> <p>2018年10月16日，OSA DC官方正式宣布与InterValue达成合作。OSA DC是世界上第一个去中心化的，依托AI人工智能和智能合约，为零售商、制造商和消费者提供实时大数据解决方案的应用。InterValue将利用其强大的技术优势与OSA一起创造一个完美的零售业生态系统。</p> <p>除此之外，InterValue已与起源资本、犇睿资本、巨鲸资本、Crypto Laboratory、Obsidian Capital、Ok Crypto、Bigcoin Capital、鳄鱼资本、Reflexion Capital、哈鲁资本、星合资本、天链资本、云链资本、创世资本、天行资本、华迎资本、令牌大师、币世界、支点、ICOdrops、ICOgens、Bigcoin等公司进行了合作。InterValue展现了基于分层分片的双层Gossip DAG的共识机制的改进，其高性能、高可用性和高安全性等特点将为行业提供更多可能性。</p> <p>InterValue在区块链生态布局建设中一直按照自己的步伐稳健前行，着力构建有现实需求的生态应用，在底层应用、通用应用以及行业应用等方面不断展开生态建设。在金融、娱乐、社交、物流、医疗、能源、公益、农业等各方面进行不断的突破。InterValue基金会也将投放生态基金，用于生态建设。同时，InterValue预备在2019年上半年推出一个生态应用——分布式存储。</p> <p>分布式存储与中心化云存储相比，成本低、效率高。中心化云存储的成本主要来自于员工工资、法律成本、数据中心租金等，这些固定成本是不变或逐渐增加的，所以中心化云存储服务的价格较高。而分布式存储成本只有中心化存储的1/100-1/10。如果分布式存储系统实现完全自动化，存储服务价格最终会降到接近于0。这样，中心化云存储服务的规模优势将败给分布式存储服务。再者，分布式存储能提高系统的可靠性、可用性和存取效率，且易于拓展，在区块链领域应用非常广泛。可以预见，分布式存储将是未来存储技术发展的一个主要方向。</p> <p>除了分布式存储领域，还有评选领域。比如说，做演员选拔，给选手打分等功能。这也将会使得区块链技术融入到大众的生活当中。</p> <p>当然，目前InterValue区块链生态建设仍然存在许多不足之处，应用落地、生态建设都需要时间。这也是为了保障在以后的使用过程中不出现问题。同时也要寻找更多的合作伙伴，内部要加强评审和筛选。在选定生态建设项目以后，尽快研发，加大执行力。下一步，InterValue将会组织研发团队进行深入讨论，建立相关制度，将核心团队的分工更加明确，不断扩大，纳入更多的合作伙伴。最重要的还是要继续完善公链本身的功能，自我研发更多的生态应用。</p> <p>最后，感谢Barton Chao为我们带来的分享，同时也让我们一起期待下次InterValue又会给我们带来什么样的惊喜吧！</p>'
        self.newscontent = $sce.trustAsHtml(htmlmmm);
        // news.getNewsInfo(self.id,function (res) {
        //     res = JSON.parse(res);
        //     if(res.code == 0) {
        //         console.log(res.article);
        //         self.newstitle = res.article.title;
        //         self.newscontent = $sce.trustAsHtml(res.article.content);
        //         $timeout(function(){
        //             $scope.$apply();
        //         });
        //     }else
        //         console.error("error~!");
        // })
    }
    self.newsInfoData();
});
