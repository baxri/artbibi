// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SocialMediaVerification {
    using ECDSA for bytes32;
    
    address public verifier; // Address of the backend server that verifies social media
    
    struct SocialAccount {
        string username;        // Social media username (e.g., Twitter handle)
        string platform;        // Social media platform (e.g., Twitter, Instagram)
        bool isVerified;        // Verification status
    }

    struct Post {
        address author;         // Address of the user who created the post
        bytes32 postHash;       // Hash of the post content
        uint256 timestamp;      // Timestamp when the post was created
        string platform;        // Platform the post was made on
    }

    // Mapping of user address to array of social accounts
    mapping(address => SocialAccount[]) public userAccounts;
    
    // Mapping to check if a platform is already registered for a user
    mapping(address => mapping(string => bool)) private platformExists;

    // Array of all posts (can also use a mapping with an ID if needed)
    Post[] public posts;

    // Event for social account registration
    event SocialAccountRegistered(address indexed user, string username, string platform);

    // Event for new post registration
    event PostRegistered(address indexed author, bytes32 postHash, uint256 timestamp, string platform);

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
    
    constructor(address _verifier) {
        verifier = _verifier;
    }

    /// @notice Step 1: User initiates verification request
    function initiateVerification(string calldata username, string calldata platform) external {
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, username, platform, block.timestamp));
        
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
        bytes32 message = keccak256(abi.encodePacked(requestId, msg.sender, username, platform));
        bytes32 ethSignedMessage = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        address signer = ECDSA.recover(ethSignedMessage, signature);
        
        require(signer == verifier, "Invalid verifier signature");
        require(verificationRequests[requestId].user == msg.sender, "Invalid request");
        
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
            isVerified: true
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

    /// @notice Register a new post on the blockchain
    /// @param postHash The hash of the post content
    /// @param platform The platform where the post was made
    function registerPost(bytes32 postHash, string calldata platform) external {
        require(platformExists[msg.sender][platform], "User is not verified for this platform");
        require(postHash != bytes32(0), "Invalid post hash");

        posts.push(Post({
            author: msg.sender,
            postHash: postHash,
            timestamp: block.timestamp,
            platform: platform
        }));

        emit PostRegistered(msg.sender, postHash, block.timestamp, platform);
    }

    /// @notice Get all posts by a user
    /// @param user The address of the user
    /// @return userPosts Array of posts created by the user
    function getUserPosts(address user) external view returns (Post[] memory userPosts) {
        uint256 count = 0;

        // Count the number of posts by the user
        for (uint256 i = 0; i < posts.length; i++) {
            if (posts[i].author == user) {
                count++;
            }
        }

        // Create a temporary array to hold user posts
        userPosts = new Post[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < posts.length; i++) {
            if (posts[i].author == user) {
                userPosts[index] = posts[i];
                index++;
            }
        }
    }

    /// @notice Get all social accounts for a user
    /// @param user The address of the user
    /// @return accounts Array of social accounts registered by the user
    function getUserSocialAccounts(address user) external view returns (SocialAccount[] memory) {
        return userAccounts[user];
    }

    /// @notice Verify if a post hash exists in the blockchain
    /// @param postHash The hash of the post to verify
    /// @return isValid True if the post exists, false otherwise
    function verifyPost(bytes32 postHash) external view returns (bool isValid) {
        for (uint256 i = 0; i < posts.length; i++) {
            if (posts[i].postHash == postHash) {
                return true;
            }
        }
        return false;
    }
}
