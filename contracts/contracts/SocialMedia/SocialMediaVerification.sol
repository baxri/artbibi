// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SocialMediaVerification is OwnableUpgradeable {
    using ECDSA for bytes32;

    address public verifier; // Address of the backend server that verifies social media

    struct SocialAccount {
        string username; // Social media username (e.g., Twitter handle)
        string platform; // Social media platform (e.g., Twitter, Instagram)
        bool isVerified; // Verification status
        uint256 postCount; // Number of posts made by this account
    }

    struct Post {
        address author; // Address of the user who created the post
        string postUrl; // URL to the original post
        uint256 timestamp; // Timestamp when the post was created
        string platform; // Platform the post was made on
        bytes32 postHash; // Hash of the post
        string authorUsername; // Username of the author on that platform
    }

    // Mapping of user address to array of social accounts
    mapping(address => SocialAccount[]) public userAccounts;
    mapping(address => uint256) public userPostsCount;

    // Mapping to check if a platform is already registered for a user
    mapping(address => mapping(string => bool)) private platformExists;

    // Array of all posts (can also use a mapping with an ID if needed)
    Post[] public posts;

    // Mapping to store post hashes by their hash
    mapping(bytes32 => Post) postByHash;
    // Add this mapping at contract level
    mapping(address => uint256[]) private userPostIndices; // Stores indices of posts for each user

    // Event for social account registration
    event SocialAccountRegistered(
        address indexed user,
        string username,
        string platform
    );

    // Event for new post registration - now includes the URL
    event PostRegistered(
        address indexed author,
        bytes32 indexed postHash,
        string postUrl,
        uint256 timestamp,
        string platform
    );

    event VerificationFailed(
        address indexed user,
        address indexed signer,
        address indexed verifier,
        string message
    );

    // Verification request status
    struct VerificationRequest {
        address user;
        string username;
        string platform;
        uint256 timestamp;
        bool isVerified;
    }

    // Mapping to store verification requests
    mapping(bytes32 => VerificationRequest) public verificationRequests;

    function initialize() external initializer onlyInitializing {
        __Ownable_init(msg.sender);
    }

    function setVerifier(address _verifier) external onlyOwner {
        verifier = _verifier;
    }

    /// @notice Step 1: User initiates verification request
    function initiateVerification(
        string calldata username,
        string calldata platform
    ) external {
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, username, platform, block.timestamp)
        );

        verificationRequests[requestId] = VerificationRequest({
            user: msg.sender,
            username: username,
            platform: platform,
            timestamp: block.timestamp,
            isVerified: false
        });

        emit VerificationInitiated(requestId, msg.sender, username, platform);
    }

    /// @notice Step 3: Backend confirms verification
    function confirmVerification(
        bytes32 requestId,
        string calldata username,
        string calldata platform,
        bytes calldata signature
    ) external {
        // Verify the signature is from our trusted verifier
        bytes32 message = keccak256(
            abi.encodePacked(requestId, msg.sender, username, platform)
        );
        bytes32 ethSignedMessage = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        address signer = ECDSA.recover(ethSignedMessage, signature);

        if (signer != verifier) {
            emit VerificationFailed(
                msg.sender,
                signer,
                verifier,
                "Invalid verifier signature"
            );
            revert("Invalid verifier signature");
        }

        require(
            verificationRequests[requestId].user == msg.sender,
            "Invalid request"
        );

        // Mark as verified and register the account
        verificationRequests[requestId].isVerified = true;

        // Register the social account
        _registerSocialAccount(msg.sender, username, platform);
    }

    // Internal function to register the account after verification
    function _registerSocialAccount(
        address user,
        string memory username,
        string memory platform
    ) internal {
        require(!platformExists[user][platform], "Platform already registered");

        SocialAccount memory newAccount = SocialAccount({
            username: username,
            platform: platform,
            isVerified: true,
            postCount: 0
        });

        userAccounts[user].push(newAccount);
        platformExists[user][platform] = true;

        emit SocialAccountRegistered(user, username, platform);
    }

    // Events
    event VerificationInitiated(
        bytes32 indexed requestId,
        address indexed user,
        string username,
        string platform
    );

    function registerPost(
        string calldata postUrl,
        string calldata platform
    ) external returns (bytes32 postHash) {
        require(
            platformExists[msg.sender][platform],
            "User is not verified for this platform"
        );
        require(bytes(postUrl).length > 0, "Post URL cannot be empty");

        // Generate hash from the URL
        postHash = keccak256(abi.encodePacked(postUrl));
        // Check if this URL has already been registered
        // Check if post already exists by searching through posts array
        require(
            postByHash[postHash].author == address(0),
            "Post already registered"
        );

        // Get author username
        SocialAccount[] storage accounts = userAccounts[msg.sender];
        string memory username;
        for (uint256 i = 0; i < accounts.length; i++) {
            if (
                keccak256(abi.encodePacked(accounts[i].platform)) ==
                keccak256(abi.encodePacked(platform))
            ) {
                username = accounts[i].username;
                break;
            }
        }

        uint256 newPostIndex = posts.length;
        posts.push(
            Post({
                author: msg.sender,
                postUrl: postUrl,
                timestamp: block.timestamp,
                platform: platform,
                postHash: postHash,
                authorUsername: username
            })
        );
        postByHash[postHash] = posts[posts.length - 1];
        userPostsCount[msg.sender]++;

        userPostIndices[msg.sender].push(newPostIndex);

        emit PostRegistered(
            msg.sender,
            postHash,
            postUrl,
            block.timestamp,
            platform
        );
    }

    function getUserPosts(
        address user
    ) external view returns (Post[] memory userPosts) {
        uint256[] storage indices = userPostIndices[user];
        userPosts = new Post[](indices.length);

        for (uint256 i = 0; i < indices.length; i++) {
            userPosts[i] = posts[indices[i]];
        }
    }

    function getAllPosts() external view returns (Post[] memory) {
        return posts;
    }

    function getUserSocialAccounts(
        address user
    ) external view returns (SocialAccount[] memory) {
        return userAccounts[user];
    }

    struct PostVerificationInfo {
        bool exists; // Whether the post exists
        address author; // Address of the post author
        string platform; // Platform where it was posted
        uint256 timestamp; // When it was posted
        string authorUsername; // Username of the author on that platform
        string postUrl; // URL to the original post
    }

    function verifyPost(
        bytes32 postHash
    ) external view returns (PostVerificationInfo memory info) {
        info.exists = false;

        Post storage post = postByHash[postHash];

        if (post.author != address(0)) {
            info.exists = true;
            info.author = post.author;
            info.platform = post.platform;
            info.timestamp = post.timestamp;
            info.postUrl = post.postUrl;
            info.authorUsername = post.authorUsername;
        }
    }
}
